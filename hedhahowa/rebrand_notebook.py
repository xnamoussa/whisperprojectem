import json

nb_path = r"C:\Users\USER\Desktop\hedhahowa\noteboookpromodele.ipynb"
with open(nb_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'markdown' or cell['cell_type'] == 'code':
        # Replace SASA with Urbain but keep the context
        new_source = []
        for line in cell['source']:
            line = line.replace('SASA Mobility', 'Urbain Mobility')
            line = line.replace('SASA Data Warehouse', 'Urbain Data Warehouse')
            line = line.replace('SASA Data Engine', 'Urbain Data Engine')
            line = line.replace('SASA project', 'Urbain Mobility project')
            line = line.replace('SASA', 'Urbain')
            new_source.append(line)
        cell['source'] = new_source

with open(nb_path, 'w', encoding='utf-8') as f:
    json.dump(nb, f)
