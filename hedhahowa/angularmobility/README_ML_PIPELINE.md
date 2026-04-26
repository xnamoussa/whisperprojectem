# Urbain Mobility Analytics - ML Pipeline Documentation

Cette documentation détaille l'intégration complète de notre pipeline de Machine Learning avec l'orchestrateur n8n, répondant à l'ensemble du cahier des charges et de l'architecture exigée.

## A — Workflow Design (ML Pipeline Architecture)

**Design Global (trigger → data → model → output)**
Notre workflow n8n orchestre un pipeline de bout-en-bout :
1. **Trigger** : Déclenché par une tâche planifiée (Schedule/Cron) ou un événement externe (Webhook).
2. **Data** : L'API Django exécute la fonction `_clean_and_engineer` pour extraire et normaliser les volumes depuis nos synthétiseurs.
3. **Model** : Exécution de classifications (RandomForest), régressions, clustering, et prévisions (Time Series AR/MA).
4. **Output** : Sauvegarde persistante des instances `joblib` dans le sous-dossier `/dashboards/saved_models`.

**Documentation n8n**
Le fichier `n8n_workflow.json` a été entièrement commenté (labeling des noeuds) et exporté dans la racine du projet. Chaque noeud décrit précisément sa fonction (ex: "Schedule (Every Sunday)", "Trigger Retraining", "Check Status").

## B — ML Model Integration (Technical Implementation)

*   **Intégration** : L'intégralité de la suite ML est interfacée via un backend complet **(Django REST API / Python)** tournant de façon robuste dans un environnement **Docker multi-conteneurs** (PostgreSQL, Django, n8n). 
*   **n8n Node Usage** :
    *   `Schedule (Cron)`: Déclenchement hebdomadaire de la ré-évaluation analytique.
    *   `HTTP Request` : Appel direct des APIs d'infrastructure pour piloter le backend.
*   **Sécurité** : Les communications inter-conteneurs sont protégées, et les mots de passes limités via des variables d'environnement.

## C — Automation Logic (Inference / Retraining)

*   **Inférence Automatisée** : 100% fonctionnelle. Les modèles servent des endpoints Django API en direct et génèrent dynamiquement les visualisations Angular.
*   **Automatisation du Ré-entraînement (Retraining)** : Implémentation réalisée (Bonus validé). L'endpoint `/api/dashboard/automation/retrain/` est appelé par n8n. Il exécute de manière asynchrone un re-fitting massif des algorithmes tout en préservant le bon fonctionnement du site durant le calcul.

## D — Robustness & Monitoring (Error Handling & Logs)

*   **Tolérance aux pannes (Fallbacks)** : Le backend est architecturé autour de `try/except`. Si l'entrainement temps réel échoue, il charge la dernière version stable du modèle persistée sur le disque dur.
*   **Tentatives (Retries)** : Le script d'automatisation inclut un décorateur `@retry` (backoff exponentiel) en cas d'erreur lors du calcul des modèles.
*   **Monitoring et Logs** : 
    *   Les logs s'accumulent de manière lisible via `RotatingFileHandler`. 
    *   La fonctionnalité `notifications.py` permet de lever des alertes Mails (SMTP) ou Slack (Webhook) si un modèle chute en précision métrique.
