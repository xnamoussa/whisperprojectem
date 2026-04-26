import json

with open('wf_webhook.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data[0]['nodes']:
    if node['type'] == 'n8n-nodes-base.webhook':
        node['parameters']['httpMethod'] = 'GET'
        
# Ensure workflow is active
data[0]['active'] = True

with open('wf_webhook.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, separators=(',', ':'))
