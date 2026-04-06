🌍 Observatoire National des Mobilités et du Territoire
📊 Tableau de bord décisionnel multi-ministères
🎯 Objectif du projet

Ce projet vise à concevoir un tableau de bord stratégique centralisé permettant à plusieurs ministères de piloter leurs indicateurs de performance en temps réel.

👉 Il offre une vision unifiée, dynamique et interactive des données liées à :

la mobilité 🚆
la sécurité 🚔
l’aménagement du territoire 🏛️
l’environnement 🌿
🧠 Problématique

Les données publiques sont souvent :

❌ dispersées entre plusieurs systèmes
❌ difficiles à croiser
❌ peu exploitables pour la décision rapide

👉 Résultat : absence de vision globale et cohérente

💡 Solution proposée

Un dashboard Power BI centralisé permettant :

✔️ L’agrégation multi-domaines des données
✔️ L’analyse croisée entre ministères
✔️ La visualisation intuitive des KPIs
✔️ La détection d’anomalies et tendances
✔️ L’aide à la décision en temps réel

🏛️ Ministères concernés
Ministère	Rôle	KPIs clés
🚆 Transports	Fluidité & performance réseau	Ponctualité, congestion, satisfaction
🚔 Intérieur	Sécurité routière	Accidents, gravité, intervention
🏛️ Aménagement	Équité territoriale	Accessibilité, investissement
🌿 Transition Écologique	Impact environnemental	CO2, AQI, énergie
🏗️ Architecture du projet
                ┌────────────────────────────┐
                │       Power BI Dashboard   │
                └────────────┬───────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   📊 Données          🧠 Modélisation        📈 Visualisation
 (MySQL / CSV)          (DAX / Python)          (Power BI)
📊 Indicateurs clés (KPIs)
🚆 Transports
KPI	Formule	Objectif
Ponctualité	Trajets à l’heure / total	≥ 95%
Retard pondéré	Σ(retard × passagers)	< 2 min
Congestion	Moyenne trafic	< 30%
Satisfaction	Score utilisateur	≥ 4
🚔 Intérieur
KPI	Description	Objectif
Accidents / M voyages	Risque normalisé	< 50
Gravité	Score pondéré	< 2
Temps intervention	Moyenne	< 10 min
Couverture caméra	Surveillance	≥ 75%
🏛️ Aménagement
KPI	Description	Objectif
Équité spatiale	Score global	≥ 75
Accessibilité PMR	% stations adaptées	≥ 80%
Participation	Engagement citoyen	≥ 75%
🌿 Écologie
KPI	Description	Objectif
CO2 / trajet	Impact carbone	< 50 g/km
AQI	Qualité de l’air	≤ 50
Énergie verte	Part EnR	≥ 50%
Mobilité durable	Score global	≥ 60%
🗂️ Données utilisées
Type	Exemples
Géographiques	Régions, villes, GPS
Transport	Trafic, retards
Sécurité	Accidents, interventions
Environnement	CO2, AQI
Social	Satisfaction, participation

📅 Période : 2019 – 2025
📦 Volume :

~500 lignes
7 tables
100+ colonnes
⚙️ Fonctionnalités principales
🎛️ Filtres interactifs
Période (année, saison)
Localisation (région, ville)
Type de transport
Niveau de performance
📈 Visualisations
🗺️ Carte de France
📊 Évolution temporelle
🔥 Heatmap accidents
📉 Corrélations
🎯 Jauges KPI
📡 Radar multi-critères
🧪 Analyses possibles

✔️ Impact des travaux sur la congestion
✔️ Corrélation trafic ↔ pollution
✔️ Zones à risque routier
✔️ Efficacité des investissements publics

🚀 Valeur ajoutée
👨‍💼 Pour les décideurs
Vision globale unifiée
Décisions rapides et basées sur données
Détection d’anomalies
👥 Pour les citoyens
Transparence
Meilleure information
Participation renforcée
🏢 Pour l’administration
Gain de temps
Optimisation des ressources
Suivi des performances
🛠️ Technologies utilisées
Outil	Rôle
Power BI	Visualisation
MySQL	Base de données
DAX	Calculs
Python / R	Analyse avancée
🧭 Navigation du dashboard
🏠 Accueil
   ├── 🚆 Transports
   ├── 🚔 Intérieur
   ├── 🏛️ Aménagement
   └── 🌿 Écologie
📌 Conclusion

Ce projet constitue une plateforme décisionnelle complète permettant :

✔️ Une gestion intelligente du territoire
✔️ Une meilleure coordination entre ministères
✔️ Une transition vers une gouvernance basée sur la donnée
