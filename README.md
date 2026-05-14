🌍 Observatoire National des Mobilités et du Territoire
🚀 AI-Powered Smart Mobility & Territorial Intelligence Platform


















🧠 Project Vision

The Mobility Analytics Platform is a next-generation national observatory designed to help ministries monitor, predict, simulate, and optimize territorial mobility through:

📊 Unified cross-ministerial dashboards
🤖 Artificial Intelligence & MLOps
🌐 Neo4j graph analytics
📡 Real-time event streaming
🔥 Predictive anomaly detection
🛰️ Territorial accessibility intelligence
📈 Full observability stack
🏛️ Ministries Involved
Ministry	Strategic Role
🚆 Transport	Traffic optimization & multimodal mobility
🚔 Interior	Road safety & incident management
🏛️ Territorial Planning	Accessibility & territorial equity
🌿 Ecological Transition	Environmental sustainability
🏗️ Global Architecture
                             ┌────────────────────┐
                             │   Angular Frontend │
                             │ Premium Dashboard  │
                             └─────────┬──────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 │                     │                     │
        ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
        │ Django Backend  │   │    Neo4j DB    │   │    Power BI     │
        │ REST APIs + JWT │   │ Graph Mobility │   │ Strategic KPIs  │
        └────────┬────────┘   └────────┬────────┘   └─────────────────┘
                 │                     │
         ┌───────▼────────┐   ┌────────▼─────────┐
         │ ML Engine      │   │ GTFS Import      │
         │ AI Models      │   │ Routes & Stops   │
         └───────┬────────┘   └────────┬─────────┘
                 │                     │
       ┌─────────▼─────────┐   ┌───────▼─────────┐
       │ MLflow Tracking   │   │ Real-Time SSE   │
       │ Versioning        │   │ Event Streaming │
       └─────────┬─────────┘   └───────┬─────────┘
                 │                     │
          ┌──────▼───────┐     ┌──────▼───────┐
          │ n8n Pipeline │     │ Grafana      │
          │ Automation   │     │ Monitoring   │
          └──────┬───────┘     └──────┬───────┘
                 │                    │
          ┌──────▼────────────────────▼──────┐
          │         Prometheus               │
          │ Infrastructure Observability     │
          └──────────────────────────────────┘
🤖 AI & Machine Learning Engine
🧠 ML Model Families
Category	Models	Purpose
Classification	Random Forest, Logistic Regression	Risk prediction
Regression	XGBoost, Ridge, Lasso	Traffic & CO2 forecasting
Clustering	KMeans, DBSCAN, GMM	Territorial segmentation
Time Series	SARIMA, XGBoost TS	Predictive mobility analytics
⚙️ MLOps Infrastructure
🔄 Automated Retraining

The platform continuously retrains AI models using:

⏰ Scheduled Cron Pipelines
📡 Real-time streaming data
🔍 Drift Detection
🤖 Automatic inference generation
📦 MLflow Integration
Features
✔️ Model versioning
✔️ Experiment tracking
✔️ Metrics history
✔️ Performance comparison
✔️ Artifact management
🔁 n8n Automation Pipelines
📌 Retraining Workflow
Cron Trigger
      ↓
HTTP Request → Django API
      ↓
Model Retraining
      ↓
Validation & Metrics
      ↓
MLflow Logging
      ↓
Email / Slack Notification
🧪 Drift Detection Workflow
New Data
    ↓
Compare Historical Distribution
    ↓
Drift Detected?
   ↙         ↘
 YES          NO
  ↓            ↓
Auto-Retrain   Log Stability
🌐 Neo4j Smart Mobility Engine

🚍 Multimodal Routing
Dijkstra shortest path
Quantified Path Patterns
Spatial & temporal constraints
Real-time path optimization
🚨 Incident Detection
Hidden traffic anomaly detection
Propagation analysis through graph relationships
Real-time SSE alerts
Congestion propagation prediction
🗺️ Territorial Accessibility
Features
Isochrone scoring
Underserved zone detection
Demand Responsive Transport (DRT)
Accessibility heatmaps
📦 Native GTFS Import

Supported files:

stops.txt
trips.txt
stop_times.txt

Automatically transformed into:

Neo4j Nodes
Relationships
Transport graph structures
📡 Real-Time Streaming
SSE (Server-Sent Events)

The platform streams:

Incident alerts
Traffic anomalies
Congestion evolution
Critical disruptions

in real-time directly to dashboards.

🧪 Digital Twin Simulation
🚧 Predictive Infrastructure Simulation

The digital twin engine simulates:

Road closures
Station shutdowns
Massive disruptions
Congestion spread
Environmental impact

before real deployment.

📊 Observability Stack
📈 Grafana Dashboards

Monitor:

API latency
CPU/RAM usage
ML performance
Active incidents
Prediction throughput
Data pipeline health
🔥 Prometheus Monitoring

Prometheus continuously scrapes:

Backend metrics
Neo4j metrics
ML engine metrics
Container health
SSE throughput
🔐 Urbain Mobility — Secure Wi-Fi System
🛡️ Secure Navigation Infrastructure
wifi-secure/
├── create_wifi.py
├── wifi_server.js
├── blocked.html
└── wifi_config.json
⚙️ Features
🔒 Private secured Wi-Fi hotspot
🌐 Controlled access gateway
🚫 Unauthorized device blocking
📡 Secure internal mobility network
🛡️ Network isolation for critical services
🚀 Launch System
Automatic Launch
start_secure.bat
Manual Launch
python create_wifi.py
npm run dev
node wifi-secure/wifi_server.js
📊 Strategic KPIs
Domain	KPI
🚆 Transport	Congestion, punctuality
🚔 Safety	Accidents, intervention time
🌿 Ecology	CO2 emissions, AQI
🏛️ Territory	Accessibility score
🧭 Dashboard Navigation
🏠 Home
 ├── 🚆 Mobility
 ├── 🚔 Security
 ├── 🌿 Ecology
 ├── 🏛️ Territorial Planning
 ├── 🤖 AI Predictions
 ├── 🌐 Neo4j Analytics
 ├── 📡 Real-Time Monitoring
 └── ⚙️ Infrastructure
🚀 Key Added Value
👨‍💼 Decision Makers
Unified national vision
Faster strategic decisions
AI-assisted governance
👥 Citizens
Transparency
Better mobility services
Improved accessibility
🏢 Administration
Automated operations
Resource optimization
Predictive territorial management
📌 Conclusion

The Mobility Analytics Platform transforms fragmented public data into a unified intelligent ecosystem powered by:

🤖 Artificial Intelligence
🌐 Neo4j Graph Analytics
📈 MLOps Automation
📡 Real-Time Monitoring
🔥 Predictive Simulation
🛡️ Secure Infrastructure

to enable data-driven governance for the smart territories of tomorrow.
