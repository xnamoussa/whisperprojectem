# 🌍 Observatoire National des Mobilités et du Territoire

## 📊 Tableau de Bord Décisionnel Multi-Ministères

---

## 🎯 Objectif du projet

Ce projet vise à concevoir un **tableau de bord stratégique centralisé** permettant à plusieurs ministères de suivre et piloter leurs indicateurs de performance en temps réel.

Il offre une **vision unifiée, dynamique et interactive** des données liées à :

* 🚆 la mobilité
* 🚔 la sécurité
* 🏛️ l’aménagement du territoire
* 🌿 l’environnement

---

## 🧠 Problématique

Les données publiques présentent aujourd’hui plusieurs limites :

* ❌ Dispersion entre différents systèmes
* ❌ Difficulté de croisement des données
* ❌ Faible exploitabilité pour une prise de décision rapide

👉 Cela entraîne une **absence de vision globale et cohérente** pour les décideurs.

---

## 💡 Solution proposée

Mise en place d’un **dashboard centralisé sous Power BI** permettant :

* ✔️ L’agrégation de données multi-domaines
* ✔️ L’analyse croisée entre ministères
* ✔️ La visualisation claire et intuitive des KPIs
* ✔️ La détection d’anomalies et de tendances
* ✔️ L’aide à la décision en temps réel

---

## 🏛️ Ministères concernés

| Ministère                | Rôle                              | KPIs clés                                |
| ------------------------ | --------------------------------- | ---------------------------------------- |
| 🚆 Transports            | Performance et fluidité du réseau | Ponctualité, congestion, satisfaction    |
| 🚔 Intérieur             | Sécurité routière                 | Accidents, gravité, temps d’intervention |
| 🏛️ Aménagement          | Équité territoriale               | Accessibilité, investissements           |
| 🌿 Transition Écologique | Impact environnemental            | CO2, AQI, énergie                        |

---

## 🏗️ Architecture du projet

```
                ┌────────────────────────────┐
                │       Power BI Dashboard   │
                └────────────┬───────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   📊 Données          🧠 Modélisation        📈 Visualisation
 (MySQL / CSV)          (DAX / Python)          (Power BI)
```

---

## 📊 Indicateurs clés (KPIs)

### 🚆 Transports

* **Ponctualité** = Trajets à l’heure / Total (≥ 95%)
* **Retard pondéré** = Σ(retard × passagers) (< 2 min)
* **Congestion** = Moyenne trafic (< 30%)
* **Satisfaction** ≥ 4

### 🚔 Intérieur

* Accidents / million de voyages (< 50)
* Gravité (< 2)
* Temps d’intervention (< 10 min)
* Couverture caméra (≥ 75%)

### 🏛️ Aménagement

* Équité spatiale (≥ 75)
* Accessibilité PMR (≥ 80%)
* Participation citoyenne (≥ 75%)

### 🌿 Écologie

* CO2 / trajet (< 50 g/km)
* AQI (≤ 50)
* Énergie verte (≥ 50%)
* Mobilité durable (≥ 60%)

---

## 🗂️ Données utilisées

| Type          | Exemples                         |
| ------------- | -------------------------------- |
| Géographiques | Régions, villes, coordonnées GPS |
| Transport     | Trafic, retards                  |
| Sécurité      | Accidents, interventions         |
| Environnement | CO2, AQI                         |
| Social        | Satisfaction, participation      |

* 📅 **Période** : 2019 – 2025
* 📦 **Volume** : ~500 lignes, 7 tables, 100+ colonnes

---

## ⚙️ Fonctionnalités principales

### 🎛️ Filtres interactifs

* Période (année, saison)
* Localisation (région, ville)
* Type de transport
* Niveau de performance

### 📈 Visualisations

* 🗺️ Carte géographique
* 📊 Évolution temporelle
* 🔥 Heatmap des accidents
* 📉 Analyse de corrélation
* 🎯 Jauges KPI
* 📡 Radar multi-critères

---

## 🧪 Analyses possibles

* ✔️ Impact des travaux sur la congestion
* ✔️ Corrélation trafic ↔ pollution
* ✔️ Identification des zones à risque
* ✔️ Évaluation de l’efficacité des investissements

---

## 🚀 Valeur ajoutée

### 👨‍💼 Pour les décideurs

* Vision globale et centralisée
* Prise de décision rapide basée sur les données
* Détection proactive des anomalies

### 👥 Pour les citoyens

* Transparence accrue
* Accès à l’information
* Participation renforcée

### 🏢 Pour l’administration

* Gain de temps
* Optimisation des ressources
* Suivi des performances

---

## 🛠️ Technologies utilisées

| Outil      | Rôle                   |
| ---------- | ---------------------- |
| Power BI   | Visualisation          |
| MySQL      | Stockage des données   |
| DAX        | Calcul des indicateurs |
| Python / R | Analyse avancée        |

---

## 🧭 Navigation du dashboard

```
🏠 Accueil
   ├── 🚆 Transports
   ├── 🚔 Intérieur
   ├── 🏛️ Aménagement
   └── 🌿 Écologie
```

---

## 📌 Conclusion

Ce projet constitue une **plateforme décisionnelle complète** permettant :

* ✔️ Une gestion intelligente du territoire
* ✔️ Une meilleure coordination inter-ministérielle
* ✔️ Une transition vers une gouvernance pilotée par la donnée

---
