# 🤖 Guide n8n — Automatisation & Pipeline ML

Ce document explique comment n8n pilote l'intelligence artificielle du projet et comment tester les automatisations.

## 📋 Rôle de n8n
n8n est le chef d'orchestre des pipelines de données. Il remplace les tâches manuelles par des automatisations intelligentes :

1.  **Triggers (Déclencheurs)** : Il surveille l'heure ou attend un signal (Webhook) pour lancer une action.
2.  **Logic Nodes** : Il décide si une ré-entraînement est nécessaire (ex: détection de dérive de données / Drift).
3.  **HTTP Nodes** : Il communique avec l'API Django pour lancer les calculs ML.
4.  **Notifications** : Il confirme le succès des opérations par email à `emna.awini.work@gmail.com`.

---

## ⏰ Quand n8n agit-il ?
Le workflow configuré (`n8n_workflow.json`) possède 3 cycles :
- **Toutes les 6 heures** : Ré-entraînement complet des modèles (Classification, Régression, etc.).
- **Toutes les 3 heures** : Génération de nouvelles prédictions (Inference Pipeline).
- **Toutes les 12 heures** : Vérification de la qualité des données (Drift Check).

---

## 🧪 Comment tester n8n ?

### 1. Accéder à l'interface
Allez sur [http://localhost:5678](http://localhost:5678).
*Identifiant : `emna.awini.work@gmail.com`*
*Mot de passe : `Mobility2026!`*

### 2. Test Manuel d'un Pipeline
- Ouvrez le workflow "Mobility Analytics — Full ML Pipeline".
- Cliquez sur un nœud de type **Cron** (ex: "Every 6h") puis cliquez sur **"Test Step"** ou cliquez simplement sur **"Execute Workflow"** en bas.
- **Vérification** : Observez les lignes vertes apparaître. Une notification doit arriver dans votre boîte email.

### 3. Tester le Webhook (Déclenchement Externe)
Vous pouvez simuler un signal externe via un terminal :
```bash
curl -X POST http://localhost:5678/webhook/ml-pipeline-trigger -H "Content-Type: application/json" -d '{"event": "inference"}'
```
**Résultat attendu** : n8n recevra l'ordre et lancera immédiatement la génération des prédictions.

### 4. Vérifier les Logs n8n
Dans l'interface n8n, cliquez sur l'icône **"Executions"** (barre latérale gauche) pour voir l'historique de chaque exécution passée et identifier les erreurs s'il y en a.
