# 📊 Guide Dashboard — Urbain Mobility Interface

Ce document guide l'utilisateur sur l'utilisation du tableau de bord ministériel.

## 📋 Ce qu'il fait
L'application Angular offre une vue décisionnelle de haut niveau :
1.  **Visualisation Pro** : Graphiques avancés via Chart.js pour tous les ministères.
2.  **ML Insights** : Intégration directe des résultats de l'IA (prédictions, segments, tendances).
3.  **Simulations** : Interface permettant aux ministres de tester des scénarios (ex: Heure de pointe, Météo).
4.  **Power BI Hub** : Accès centralisé aux rapports Power BI intégrés.

---

## ⏰ Quand l'utiliser ?
Il est utilisé en temps réel par les décideurs pour :
- Surveiller la mobilité urbaine au quotidien.
- Analyser les prédictions générées par n8n pendant la nuit.
- Exporter des rapports de prédiction (PDF/Excel) pour les réunions.

---

## 🧪 Comment tester le Dashboard ?

### 1. Connexion (Login)
Allez sur [http://localhost:4200/login](http://localhost:4200/login)
Utilisez l'un des comptes pré-configurés :
- **Transport** : `emna.awini@esprit.tn` / `emma123`
- **Intérieur** : `Ayed.rayen@esprit.tn` / `Realmadridftw123.`

### 2. Tester les Scénarios
- Naviguez vers l'onglet **Predictions** ou **Analytique**.
- Changez les filtres (Ville, Météo, Heure de pointe).
- Cliquez sur **"Lancer la Prédiction"**.
- Vérification : Les graphiques doivent s'actualiser avec les nouvelles données calculées par le backend.

### 3. Export de Données
- Dans l'onglet prédiction, cliquez sur le bouton **"Exporter PDF"** ou **"Excel"**.
- Vérification : Un fichier formaté professionnellement doit se télécharger.
