import json

with open('wf_temp.json', 'r') as f:
    data = json.load(f)

for node in data[0]['nodes']:
    if node['id'] == 'bdbd3770-78df-48c3-b835-2ffc8eb6a791':
        node['name'] = 'Send Notification Email'
        node['type'] = 'n8n-nodes-base.httpRequest'
        node['typeVersion'] = 4.1
        node['parameters'] = {
            "method": "POST",
            "url": "http://host.docker.internal:8000/api/dashboard/automation/test-email/",
            "sendBody": True,
            "bodyParameters": {
                "parameters": [
                    {
                        "name": "recipient",
                        "value": "emna.awini.work@gmail.com"
                    }
                ]
            },
            "options": {}
        }

conns = data[0]['connections']
if 'Check Status & Metrics' in conns:
    for conn in conns['Check Status & Metrics']['main'][0]:
        if conn['node'] == 'Notification Placeholder':
            conn['node'] = 'Send Notification Email'

with open('wf_temp.json', 'w') as f:
    json.dump(data, f, separators=(',', ':'))
