import re

def sql_to_django():
    with open('datawhehousebi (1).sql', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    table_pattern = re.compile(r"CREATE TABLE IF NOT EXISTS `([^`]+)` \((.*?)\) ENGINE", re.DOTALL | re.IGNORECASE)
    column_pattern = re.compile(r"`([^`]+)` ([^,\n\r\t]+)", re.IGNORECASE)

    models_code = ["from django.db import models\n"]
    
    for match in table_pattern.finditer(content):
        table_name = match.group(1)
        # Convert table name to PascalCase
        class_name = "".join(word.capitalize() for word in table_name.split('_'))
        
        models_code.append(f"class {class_name}(models.Model):")
        
        columns_block = match.group(2)
        primary_key = None
        pk_match = re.search(r"PRIMARY KEY \(`([^`]+)`\)", columns_block)
        if pk_match:
            primary_key = pk_match.group(1)
            
        for col_match in column_pattern.finditer(columns_block):
            col_name = col_match.group(1)
            col_type_raw = col_match.group(2).lower()
            
            if col_name.lower().startswith('fk_') or col_name.lower().startswith('idx_'):
                continue # Key definitions handle these
            
            django_field = ""
            args = ["null=True", "blank=True"]
            if col_name == primary_key:
                args.append("primary_key=True")
                args.remove("null=True") # PK cannot be null in Django usually
            
            if 'varchar' in col_type_raw:
                size_match = re.search(r"\((\d+)\)", col_type_raw)
                size = size_match.group(1) if size_match else "255"
                django_field = f"models.CharField(max_length={size}, {', '.join(args)})"
            elif 'decimal' in col_type_raw:
                prec_match = re.search(r"\((\d+),(\d+)\)", col_type_raw)
                if prec_match:
                    max_digits = prec_match.group(1)
                    decimal_places = prec_match.group(2)
                    django_field = f"models.DecimalField(max_digits={max_digits}, decimal_places={decimal_places}, {', '.join(args)})"
                else:
                    django_field = f"models.DecimalField(max_digits=18, decimal_places=6, {', '.join(args)})"
            elif 'timestamp' in col_type_raw or 'datetime' in col_type_raw:
                django_field = f"models.DateTimeField({', '.join(args)})"
            elif 'date' in col_type_raw and 'timestamp' not in col_type_raw:
                django_field = f"models.DateField({', '.join(args)})"
            elif 'int' in col_type_raw:
                django_field = f"models.IntegerField({', '.join(args)})"
            elif 'text' in col_type_raw:
                django_field = f"models.TextField({', '.join(args)})"
            elif 'tinyint(1)' in col_type_raw:
                django_field = f"models.BooleanField(default=False, {', '.join(args)})"
            elif 'time' in col_type_raw: # Check for 'time' but avoid 'timestamp'
                 django_field = f"models.TimeField({', '.join(args)})"
            else:
                django_field = f"models.CharField(max_length=255, {', '.join(args)})"
            
            models_code.append(f"    {col_name} = {django_field}")
        
        models_code.append("") # Empty line between classes

    with open('dashboards/models.py', 'w', encoding='utf-8') as f:
        f.write("\n".join(models_code))
    print("Generated dashboards/models.py successfully.")

if __name__ == '__main__':
    sql_to_django()
