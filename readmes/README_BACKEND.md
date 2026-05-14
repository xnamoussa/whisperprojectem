# 🧠 Guide Backend — ML Engine & API

Ce document détaille le fonctionnement interne du moteur d'IA et des services de notification.

## 📋 Ce qu'il fait
Le backend Django est le centre de calcul haute performance du projet :
1.  **ML Engine** : Exécute des modèles complexes (Random Forest, XGBoost, SARIMA, LSTM/Transfo) via `ml_engine.py`.
2.  **Automation API** : Fournit les points d'entrée à n8n pour piloter les modèles (`ml_automation.py`).
3.  **Service de Notification** : Envoie des rapports HTML professionnels et logue chaque alerte pour la traçabilité.
4.  **Chatbot Intelligence** : Service de messagerie intelligent pour les ministres.

---

## ⏰ Quand le Backend agit-il ?
Il agit en continu pour répondre aux requêtes du Dashboard, mais subit des pics d'activité lors des appels n8n :
- **Sur demande** : Quand un ministre consulte un graphique ML.
- **En arrière-plan** : Lors des phases de calcul intensif déclenchées par n8n.

---

## 🧪 Comment tester le Backend ?

### 1. Test du Service Email (SMTP)
C'est le test le plus important pour vérifier que vous recevrez les alertes :
```bash
# Via PowerShell / Terminal
Invoke-RestMethod -Uri "http://localhost:8000/api/dashboard/automation/test-email/" -Method Post -Body '{"recipient": "emna.awini.work@gmail.com"}' -ContentType "application/json"
```
**Résultat attendu** : Un email HTML professionnel doit arriver sur `emna.awini.work@gmail.com`.

### 2. Statut Global de l'Automatisation
Visitez : [http://localhost:8000/api/dashboard/automation/status/](http://localhost:8000/api/dashboard/automation/status/)
Vous verrez en temps réel les résultats des derniers entraînements et des dernières inférences.

### 3. Consulter les Logs
Les logs sont stockés dans le dossier `dashboards/logs/` :
- `app.log` : Activité générale de l'API.
- `ml_engine.log` : Détails techniques des calculs IA.
- `notifications.log` : Historique de tous les emails envoyés.
