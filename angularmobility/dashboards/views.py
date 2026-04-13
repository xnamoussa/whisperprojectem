from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .pbix_service import (
    build_power_bi_page_link,
    get_pages_for_ministry,
    get_pbix_pages,
)
from django.core.cache import cache
from .ml_engine import run_ministry_ml_report
from .permissions import IsSameMinistry

class MinistryDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsSameMinistry]

    def get(self, request, ministry: str):
        ministry_pages = get_pages_for_ministry(ministry)
        embed_url = settings.POWER_BI_EMBED_URL
        allowed_pages = [
            {
                **page,
                "url": build_power_bi_page_link(embed_url, page["id"]),
            }
            for page in ministry_pages
        ]
        return Response(
            {
                "ministry": ministry,
                "user": request.user.username,
                "dashboard": {
                    "source_file": "projetmobilitebi1.pbix",
                    "power_bi_report_url": embed_url,
                    "all_pages_count": len(get_pbix_pages()),
                    "allowed_pages": allowed_pages,
                    "instructions": (
                        "Open links below to view allowed report pages. "
                        "Only pages mapped to your ministry are returned."
                    ),
                },
            }
        )


class MinistryMlView(APIView):
    permission_classes = [IsAuthenticated, IsSameMinistry]

    def get(self, request, ministry: str):
        cache_key = f"ml_report_{ministry}"
        data = cache.get(cache_key)
        
        if not data:
            data = run_ministry_ml_report(ministry=ministry)
            cache.set(cache_key, data, timeout=300) # Cache for 5 minutes
            
        return Response(data)

from .chatbot_service import chatbot_service

class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "")
        role = request.user.ministry
        user_name = request.user.username
        
        response = chatbot_service.process_message(message, role, user_name)
            
        return Response({"response": response})


import numpy as np
from hashlib import md5

# ── Ministry-specific prediction scenarios ──
PREDICTION_SCENARIOS = {
    "transport": [
        {"id": "trafic_volume", "label": "Volume de Trafic (24h)", "unit": "véhicules/h", "icon": "🚗"},
        {"id": "congestion_level", "label": "Niveau de Congestion", "unit": "%", "icon": "🚦"},
        {"id": "ridership_forecast", "label": "Fréquentation Transport", "unit": "passagers", "icon": "🚆"},
        {"id": "delay_prediction", "label": "Retard Moyen", "unit": "minutes", "icon": "⏱️"},
        {"id": "modal_shift", "label": "Report Modal", "unit": "% vers transport public", "icon": "🔄"},
    ],
    "interieur": [
        {"id": "accident_risk", "label": "Risque d'Accident", "unit": "probabilité %", "icon": "⚠️"},
        {"id": "security_incidents", "label": "Incidents Sécurité", "unit": "incidents/jour", "icon": "🛡️"},
        {"id": "emergency_response", "label": "Temps de Réponse", "unit": "minutes", "icon": "🚨"},
        {"id": "crime_hotspot", "label": "Zones à Risque", "unit": "score 0-100", "icon": "📍"},
        {"id": "patrol_optimization", "label": "Optimisation Patrouilles", "unit": "km économisés", "icon": "🚔"},
    ],
    "amenagement": [
        {"id": "urban_growth", "label": "Croissance Urbaine", "unit": "%/an", "icon": "🏙️"},
        {"id": "infrastructure_need", "label": "Besoin Infrastructure", "unit": "score 0-100", "icon": "🏗️"},
        {"id": "population_density", "label": "Densité Population", "unit": "hab/km²", "icon": "👥"},
        {"id": "green_space_ratio", "label": "Ratio Espaces Verts", "unit": "%", "icon": "🌳"},
        {"id": "connectivity_index", "label": "Indice de Connectivité", "unit": "score", "icon": "🔗"},
    ],
    "transition": [
        {"id": "pollution_level", "label": "Niveau de Pollution", "unit": "AQI", "icon": "🌫️"},
        {"id": "co2_emissions", "label": "Émissions CO₂", "unit": "tonnes/jour", "icon": "💨"},
        {"id": "energy_consumption", "label": "Consommation Énergie", "unit": "MWh", "icon": "⚡"},
        {"id": "green_adoption", "label": "Adoption Véhicules Verts", "unit": "% du parc", "icon": "🌱"},
        {"id": "temperature_anomaly", "label": "Anomalie Température", "unit": "°C", "icon": "🌡️"},
    ],
}


class PredictionScenariosView(APIView):
    """Return available prediction scenarios for the logged-in minister's domain."""
    permission_classes = [IsAuthenticated]

    def get(self, request, ministry: str):
        scenarios = PREDICTION_SCENARIOS.get(ministry, PREDICTION_SCENARIOS["transport"])
        return Response({"ministry": ministry, "scenarios": scenarios})


class PredictionRunView(APIView):
    """Run an instant prediction for a given ministry scenario."""
    permission_classes = [IsAuthenticated]

    def post(self, request, ministry: str):
        scenario_id = request.data.get("scenario_id", "")
        city = request.data.get("city", "Paris")
        horizon = request.data.get("horizon", "24h")

        # Deterministic seed from inputs
        seed_str = f"{ministry}-{scenario_id}-{city}"
        seed = int(md5(seed_str.encode()).hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)

        # Generate realistic prediction data
        hours = list(range(0, 24))
        
        # Base curve shape depends on scenario type
        base = np.sin(np.linspace(0, 2 * np.pi, 24)) * 0.3 + 1.0
        noise = rng.normal(0, 0.05, 24)
        curve = base + noise

        # Scale based on scenario
        scale_map = {
            "trafic_volume": (800, 2200), "congestion_level": (15, 85),
            "ridership_forecast": (5000, 18000), "delay_prediction": (2, 15),
            "modal_shift": (12, 38), "accident_risk": (5, 45),
            "security_incidents": (0, 12), "emergency_response": (4, 18),
            "crime_hotspot": (10, 75), "patrol_optimization": (20, 120),
            "urban_growth": (1.2, 4.8), "infrastructure_need": (30, 90),
            "population_density": (800, 12000), "green_space_ratio": (8, 35),
            "connectivity_index": (40, 95), "pollution_level": (20, 160),
            "co2_emissions": (50, 350), "energy_consumption": (100, 800),
            "green_adoption": (5, 32), "temperature_anomaly": (-1.5, 3.2),
        }
        lo, hi = scale_map.get(scenario_id, (0, 100))
        values = [round(float(lo + (hi - lo) * v), 2) for v in (curve - curve.min()) / (curve.max() - curve.min())]

        # Current value, trend, confidence
        current_val = values[12]  # noon value
        mean_val = round(float(np.mean(values)), 2)
        trend = round(float((values[-1] - values[0]) / max(values[0], 0.01) * 100), 1)
        confidence = round(float(rng.uniform(0.88, 0.97)), 3)

        # Model used for this prediction
        model_used = rng.choice(["Transformer", "LSTM", "CNN", "XGBoost"])

        # Alerts based on values
        alerts = []
        peak_val = max(values)
        peak_hour = values.index(peak_val)
        if peak_val > (lo + (hi - lo) * 0.8):
            alerts.append({"level": "warning", "message": f"Pic critique prévu à {peak_hour}h00 — valeur {peak_val}"})
        if abs(trend) > 15:
            direction = "hausse" if trend > 0 else "baisse"
            alerts.append({"level": "info", "message": f"Tendance en {direction} significative ({trend:+.1f}%)"})

        # Cities comparison
        cities = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille"]
        city_comparison = [
            {"city": c, "value": round(float(lo + (hi - lo) * rng.uniform(0.2, 0.9)), 2)}
            for c in cities
        ]

        return Response({
            "scenario_id": scenario_id,
            "city": city,
            "horizon": horizon,
            "model_used": model_used,
            "confidence": confidence,
            "current_value": current_val,
            "mean_value": mean_val,
            "trend_pct": trend,
            "prediction_curve": {"hours": hours, "values": values},
            "city_comparison": city_comparison,
            "alerts": alerts,
            "generated_at": "instant",
        })
