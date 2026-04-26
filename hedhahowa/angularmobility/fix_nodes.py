import json

with open('wf_webhook.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

wf = data[0]

# Replace all executeCommand nodes with noOp (compatible with n8n 2.16+)
for node in wf['nodes']:
    if node['type'] == 'n8n-nodes-base.executeCommand':
        node['type'] = 'n8n-nodes-base.noOp'
        node['typeVersion'] = 1
        node['parameters'] = {}

wf['active'] = True

with open('wf_webhook.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, separators=(',', ':'), ensure_ascii=False)

print("Done - replaced executeCommand nodes with noOp")
