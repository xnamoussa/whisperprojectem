import json
with open('wf_temp.json', 'r') as f:
    data = json.load(f)

for node in data[0]['nodes']:
    if node['id'] == '0644478e-c08c-4875-a00b-63c5fae82a44':
        node['name'] = 'Schedule (Every 1 Hour)'
        node['parameters'] = {'rule': {'interval': [{'field': 'hours', 'hoursInterval': 1}]}}

conns = data[0]['connections']
if 'Schedule (Every Sunday)' in conns:
    conns['Schedule (Every 1 Hour)'] = conns.pop('Schedule (Every Sunday)')

sd = data[0].get('staticData', {})
if 'node:Schedule (Every Sunday)' in sd:
    sd['node:Schedule (Every 1 Hour)'] = sd.pop('node:Schedule (Every Sunday)')

with open('wf_temp.json', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
