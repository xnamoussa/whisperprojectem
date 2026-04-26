import json

with open('wf_webhook.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

wf = data[0]

# 1. Fix ALL schedule triggers to reasonable intervals
for node in wf['nodes']:
    if node['name'] == '⏰ Cron — Retrain Every 6h':
        node['parameters'] = {'rule': {'interval': [{'field': 'hours', 'hoursInterval': 1}]}}
        node['name'] = '⏰ Cron — Retrain Every 1h'
    elif node['name'] == '⏰ Cron — Inference Every 3h':
        node['parameters'] = {'rule': {'interval': [{'field': 'hours', 'hoursInterval': 1}]}}
        node['name'] = '⏰ Cron — Inference Every 1h'
    elif node['name'] == '⏰ Cron — Drift Check 12h':
        node['parameters'] = {'rule': {'interval': [{'field': 'hours', 'hoursInterval': 2}]}}
        node['name'] = '⏰ Cron — Drift Check 2h'

# 2. Fix connections to match renamed nodes
conns = wf['connections']
new_conns = {}
rename_map = {
    '⏰ Cron — Retrain Every 6h': '⏰ Cron — Retrain Every 1h',
    '⏰ Cron — Inference Every 3h': '⏰ Cron — Inference Every 1h',
    '⏰ Cron — Drift Check 12h': '⏰ Cron — Drift Check 2h',
}

for key, val in conns.items():
    new_key = rename_map.get(key, key)
    new_conns[new_key] = val

# 3. Add missing connections for email nodes  
# Connect Log Retrain Result -> Email Retrain Report
new_conns['💻 Execute — Log Retrain Result'] = {
    'main': [[{'node': '📧 HTTP — Email Retrain Report', 'type': 'main', 'index': 0}]]
}
# Connect Log Inference Result -> Email Inference Report
new_conns['💻 Execute — Log Inference Result'] = {
    'main': [[{'node': '📧 HTTP — Email Inference Report', 'type': 'main', 'index': 0}]]
}
# Connect Check Retrain Status -> Log Retrain Result
new_conns['📋 HTTP — Check Retrain Status'] = {
    'main': [[{'node': '💻 Execute — Log Retrain Result', 'type': 'main', 'index': 0}]]
}
# Connect Check Inference Status -> Log Inference Result
new_conns['📋 HTTP — Check Inference Status'] = {
    'main': [[{'node': '💻 Execute — Log Inference Result', 'type': 'main', 'index': 0}]]
}
# Connect Drift IF False -> Log No Drift
if '🔀 IF — Drift Detected?' in new_conns:
    existing = new_conns['🔀 IF — Drift Detected?']['main']
    if len(existing) < 2:
        existing.append([{'node': '💻 Execute — Log No Drift', 'type': 'main', 'index': 0}])
# Connect Auto-Retrain Drift -> Log Drift Retrain
new_conns['🔄 HTTP — Auto-Retrain (Drift)'] = {
    'main': [[{'node': '💻 Execute — Log Drift Retrain', 'type': 'main', 'index': 0}]]
}

wf['connections'] = new_conns

# 4. Mark workflow as active
wf['active'] = True

with open('wf_webhook.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, separators=(',', ':'), ensure_ascii=False)

print("✅ Workflow updated successfully!")
print(f"   Nodes: {len(wf['nodes'])}")
print(f"   Connections: {len(new_conns)}")
print(f"   Active: {wf['active']}")
