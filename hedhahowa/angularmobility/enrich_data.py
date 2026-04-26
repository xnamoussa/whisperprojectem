import os
import re
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from dashboards.models import (
    DimArretMobilite, DimCapteurStation, DimEvenementMobilite,
    DimLigneMobilite, DimModeEnvironnement, DimModeVehicule,
    DimPolluant, DimSecurite, DimSegmentMobilite, DimTime,
    DimTypeCarburant, DimZone, FactEnvironnementale, FactMobility
)

SQL_FILE = 'datawhehousebi (1).sql'

def clean_val(val):
    val = val.strip()
    if val.upper() == 'NULL':
        return None
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1].replace("''", "'")
    return val

def parse_sql_dump():
    print(f"Reading {SQL_FILE}...")
    with open(SQL_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    pattern = re.compile(r"INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*(.*?);", re.DOTALL | re.IGNORECASE)
    
    table_map = {
        'dim_arret_mobilite': DimArretMobilite,
        'dim_capteur_station': DimCapteurStation,
        'dim_evenement_mobilite': DimEvenementMobilite,
        'dim_ligne_mobilite': DimLigneMobilite,
        'dim_mode_environnement': DimModeEnvironnement,
        'dim_mode_vehicule': DimModeVehicule,
        'dim_polluant': DimPolluant,
        'dim_securite': DimSecurite,
        'dim_segment_mobilite': DimSegmentMobilite,
        'dim_time': DimTime,
        'dim_type_carburant': DimTypeCarburant,
        'dim_zone': DimZone,
        'fact_environnementale': FactEnvironnementale,
        'fact_mobility': FactMobility,
    }

    for match in pattern.finditer(content):
        table_name = match.group(1).lower()
        if table_name not in table_map:
            continue
        
        columns = [c.strip(' `') for c in match.group(2).split(',')]
        values_block = match.group(3)
        row_pattern = re.compile(r"\((.*?)\)(?:,|$)", re.DOTALL)
        
        objs = []
        model_class = table_map[table_name]
        valid_fields = {f.name for f in model_class._meta.fields}
        
        for row_match in row_pattern.finditer(values_block):
            raw_values = row_match.group(1)
            row_values = []
            current = ""
            in_quotes = False
            for char in raw_values:
                if char == "'" and (len(current) == 0 or current[-1] != "\\"):
                    in_quotes = not in_quotes
                    current += char
                elif char == "," and not in_quotes:
                    row_values.append(clean_val(current))
                    current = ""
                else:
                    current += char
            row_values.append(clean_val(current))
            
            if len(row_values) != len(columns):
                continue
            
            raw_data = dict(zip(columns, row_values))
            # Filter data to only include keys that exist in the model
            filtered_data = {k: v for k, v in raw_data.items() if k in valid_fields}
            
            try:
                objs.append(model_class(**filtered_data))
            except Exception as e:
                print(f"Error creating object for {table_name}: {e}")

        if objs:
            print(f"Importing {len(objs)} records into {table_name}...")
            model_class.objects.all().delete()
            model_class.objects.bulk_create(objs, ignore_conflicts=True)

def enrich_data():
    print("Starting data enrichment (2019-2025)...")
    
    zones = list(DimZone.objects.all())
    modes = list(DimLigneMobilite.objects.values_list('col_line_id', flat=True))
    
    if not zones:
        print("No zones (DimZone) found. Using placeholder zones for enrichment.")
        # Create at least one zone if empty
        zone, _ = DimZone.objects.get_or_create(col_zone_id="Z_DEFAULT", defaults={'col_ville': 'Paris'})
        zones = [zone]

    start_date = datetime(2019, 1, 1)
    end_date = datetime(2025, 12, 31)
    current_date = start_date
    
    mobility_batch = []
    env_batch = []
    
    count = 0
    while current_date <= end_date:
        # Generate data for more zones every single day for high density
        sampled_zones = random.sample(zones, k=min(len(zones), 12))
        for zone in sampled_zones:
            # Mobility Fact
            mobility_batch.append(FactMobility(
                col_mobilite_id=f"ENR_MOB_{count}",
                col_time_id=f"TIME_{current_date.strftime('%Y%m%d%H')}",
                col_zone_id=zone.col_zone_id,
                col_mode_id=random.choice(['1', '2', '3', '4']),
                col_ligne_id=random.choice(modes) if modes else 'L01',
                col_trafic_mesure=str(random.randint(500, 5000)),
                col_vitesse_moyenne=Decimal(str(random.uniform(20, 75))),
                col_congestion_level=random.randint(0, 100),
                col_nb_passagers=random.randint(10, 800),
                col_nbr_accidents=random.randint(0, 3) if random.random() > 0.9 else 0,
                col_date1=current_date.date(),
                col_date_insertion=current_date
            ))
            
            # Env Fact (Correlated with mobility)
            co2_base = Decimal(str(random.uniform(50, 450)))
            mobility_impact = Decimal(str(random.uniform(0.5, 2.0)))
            co2 = co2_base * mobility_impact
            
            env_batch.append(FactEnvironnementale(
                col_environnement_id=f"ENR_ENV_{count}",
                col_zone_id=zone.col_zone_id,
                col_time_id=f"TIME_{current_date.strftime('%Y%m%d%H')}",
                col_valeur_co2=round(co2, 2),
                col_aqi_moyen=Decimal(str(random.randint(20, 200))),
                col_temperature=Decimal(str(random.uniform(-5, 40))),
                col_condition_meteo=random.choice(['Ensoleillé', 'Nuageux', 'Pluie', 'Brouillard', 'Orage']),
                col_date1=current_date.date(),
                col_date_insertion=current_date
            ))
            
            count += 1
            
            if len(mobility_batch) >= 1500:
                FactMobility.objects.bulk_create(mobility_batch, ignore_conflicts=True)
                FactEnvironnementale.objects.bulk_create(env_batch, ignore_conflicts=True)
                mobility_batch = []
                env_batch = []

        # Daily data for high fidelity
        current_date += timedelta(days=1)

    if mobility_batch:
        FactMobility.objects.bulk_create(mobility_batch, ignore_conflicts=True)
    if env_batch:
        FactEnvironnementale.objects.bulk_create(env_batch, ignore_conflicts=True)
        
    print(f"Enrichment complete. Total generated records: {count}")

if __name__ == '__main__':
    parse_sql_dump()
    enrich_data()
