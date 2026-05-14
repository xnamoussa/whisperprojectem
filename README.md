markdown
# 🌍 Observatoire National des Mobilités et du Territoire

**🚀 AI-Powered Smart Mobility & Territorial Intelligence Platform**

![Hero Banner](https://placehold.co/1200x400/0A2540/00D4FF?text=Observatoire+National+des+Mobilités+et+du+Territoire)

> Une plateforme intelligente unifiée pour monitorer, prédire, simuler et optimiser la mobilité territoriale à l'échelle nationale.

---

## 📌 Badges

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Django](https://img.shields.io/badge/Django-5.0-green?logo=django)
![Neo4j](https://img.shields.io/badge/Neo4j-5.x-008CC1?logo=neo4j)
![Angular](https://img.shields.io/badge/Angular-17-red?logo=angular)
![MLflow](https://img.shields.io/badge/MLflow-2.x-0194E2?logo=mlflow)
![Grafana](https://img.shields.io/badge/Grafana-Monitoring-orange?logo=grafana)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🧠 Vision du Projet

L'**Observatoire National des Mobilités** est un observatoire de nouvelle génération conçu pour aider les ministères à transformer des données fragmentées en **intelligence territoriale actionable** grâce à l'IA, l'analyse de graphes et la simulation prédictive.

### 🎯 Objectifs Stratégiques

| Objectif | Description |
|----------|-------------|
| 📊 **Tableaux de bord interministériels unifiés** | Vue consolidée multi-sources |
| 🤖 **Intelligence Artificielle & MLOps avancés** | Modèles prédictifs et retraining automatique |
| 🔗 **Analyse de graphes Neo4j** | Routage multimodal et détection d'incidents |
| ⚡ **Détection d'anomalies en temps réel** | Alertes instantanées sur flux transports |
| 🗺️ **Intelligence d'accessibilité territoriale** | Isochrones et zones mal desservies |
| 🧪 **Jumeau numérique (Digital Twin)** | Simulations de scénarios de disruption |

---

## 🏛️ Ministères Impliqués

| Ministère | Rôle Stratégique |
|-----------|------------------|
| 🚆 **Transports** | Optimisation du trafic & mobilité multimodale |
| 🚔 **Intérieur** | Sécurité routière & gestion des incidents |
| 🏛️ **Aménagement du Territoire** | Accessibilité & équité territoriale |
| 🌿 **Transition Écologique** | Durabilité environnementale & émissions |

---

## 🏗️ Architecture Globale

```mermaid
flowchart TD
    A[🌐 Angular Frontend\nPremium Dashboard] --> B[Django Backend\nREST APIs + JWT]
    A --> C[Power BI\nKPIs Stratégiques]
    B <--> D[Neo4j\nGraph Mobility]
    B <--> E[ML Engine\nAI Models]
    E <--> F[MLflow\nTracking & Versioning]
    D <--> G[GTFS Import\nRoutes & Stops]
    B <--> H[SSE Real-Time\nEvent Streaming]
    H <--> I[Grafana + Prometheus\nObservabilité]
    E <--> J[n8n\nAutomation Pipelines]
🤖 Moteur d'Intelligence Artificielle
🧠 Familles de Modèles ML
Catégorie	Modèles	Usage Principal
Classification	Random Forest, Logistic Regression	Prédiction de risques
Régression	XGBoost, Ridge, Lasso	Prévision trafic & émissions CO₂
Clustering	KMeans, DBSCAN, GMM	Segmentation territoriale
Time Series	SARIMA, XGBoost TS	Analyse prédictive de mobilité
⚙️ Infrastructure MLOps
✅ Retraining automatique via Cron + Drift Detection

✅ MLflow complet (versioning, tracking, comparaison)

✅ Pipelines n8n pour l'automatisation

text
┌─────────────────────────────────────────────────────────┐
│                     MLOps Workflow                       │
├─────────────────────────────────────────────────────────┤
│  Data → Drift Detection → Retraining → MLflow → Deploy  │
└─────────────────────────────────────────────────────────┘
🌐 Moteur Neo4j Smart Mobility
Fonctionnalités Clés
Fonctionnalité	Description
🛣️ Routage Multimodal	Dijkstra + contraintes spatio-temporelles
🚨 Détection d'Incidents	Propagation dans le graphe
🗺️ Accessibilité Territoriale	Isochrones, zones mal desservies, DRT
📥 Import GTFS automatique	stops, trips, stop_times → Graphe Neo4j
Structure du Graphe








🧪 Jumeau Numérique & Simulations Prédictives
Scénarios simulables
🔒 Fermetures de routes / gares

🌊 Disruptions massives (intempéries, grèves)

🚗 Propagation des congestions

🌍 Impacts environnementaux (CO₂, qualité de l'air)

📊 Stack d'Observabilité
Outil	Usage
Grafana	Dashboards temps réel (latence, ML, incidents)
Prometheus	Métriques infrastructure & applicatives
SSE	Alertes en temps réel vers les tableaux de bord
Exemple de métriques temps réel
text
🟢 latence API: 43ms
🟡 charge prédiction: 32%
🔴 incident détecté (A86)
🔐 Système Wi-Fi Sécurisé Urbain
text
wifi-secure/
├── create_wifi.py      # Configuration hotspot
├── wifi_server.js      # Serveur d'authentification
├── blocked.html        # Page de blocage
└── wifi_config.json    # Paramètres réseau
Fonctionnalités : Hotspot sécurisé, contrôle d'accès, isolation réseau.

📈 KPIs Stratégiques
Domaine	KPIs Principaux
🚆 Transport	Taux de congestion, Ponctualité
🚔 Sécurité	Accidents, Temps d'intervention
🌿 Écologie	Émissions CO₂, Indice AQI
🏛️ Territoire	Score d'accessibilité
Dashboard KPIs
text
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  🚆 Transport │  🚔 Sécurité  │  🌿 Écologie  │ 🏛️ Territoire │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Congestion  │  Accidents  │ CO₂: 112g   │ Accessibilité│
│   68%       │    -12%     │   /pkm      │    74/100    │
│ Ponctualité │ Intervention│ AQI: 42     │ Déserts mob. │
│   91%       │   4.2min    │   (Bon)     │    8 zones   │
└─────────────┴─────────────┴─────────────┴─────────────┘
🧭 Navigation du Dashboard
text
🏠 Accueil
├── 🚆 Mobilité
├── 🚔 Sécurité
├── 🌿 Écologie
├── 🏛️ Aménagement du Territoire
├── 🤖 Prédictions IA
├── 🌐 Analytics Neo4j
├── 📡 Monitoring Temps Réel
└── ⚙️ Infrastructure
✨ Valeur Ajoutée
Bénéficiaire	Apport
👨‍💼 Décideurs Publics	Vision nationale unifiée, décisions accélérées, gouvernance assistée par IA
👥 Citoyens	Transparence totale, services de mobilité améliorés, meilleure accessibilité
🏢 Administration	Automatisation des opérations, optimisation des ressources, gestion prédictive
📸 Aperçu de l'interface
Dashboard Principal	Carte d'Accessibilité	Détection d'Anomalies
https://placehold.co/400x250/1E3A8A/60A5FA?text=Dashboard+Principal	https://placehold.co/400x250/166534/4ADE80?text=Carte+Isochrone	https://placehold.co/400x250/7F1D1D/F87171?text=D%C3%A9tection+IA
💡 Remplacez ces placeholders par vos vraies captures d'écran une fois le frontend déployé.

🚀 Pour Commencer
bash
# Cloner le repository
git clone https://github.com/votre-org/observatoire-mobilites.git
cd observatoire-mobilites

# Lancer le Wi-Fi sécurisé
cd wifi-secure
python create_wifi.py

# Démarrer l'application
npm run dev
Prérequis
Python 3.11+

Node.js 18+

Neo4j 5.x

Docker (optionnel)

🔗 Technologies Principales
<img width="1906" height="842" alt="690856575_860022219716526_8323994533816562916_n" src="https://github.com/user-attachments/assets/38278fcc-3425-463d-990f-86755fb9f6dd" />

<p align="center"> <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" /> <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" /> <img src="https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white" /> <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" /> <img src="https://img.shields.io/badge/XGBoost-FF6F00?style=for-the-badge&logo=xgboost&logoColor=white" /> <img src="https://img.shields.io/badge/MLflow-0194E2?style=for-the-badge&logo=mlflow&logoColor=white" /> <img src="https://img.shields.io/badge/n8n-1E6F5C?style=for-the-badge&logo=n8n&logoColor=white" /> <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" /> <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" /> <img src="https://img.shields.io/badge/GTFS-28A745?style=for-the-badge&logo=gtfs&logoColor=white" /> </p>
📄 License
MIT © Observatoire National des Mobilités

