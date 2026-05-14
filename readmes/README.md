# 🏛️ Urbain Mobility Analytics — Ministerial Platform

Bienvenue sur la plateforme de pilotage de la mobilité urbaine. Ce projet intègre l'IA (Machine Learning) et l'automatisation de pointe pour faciliter la prise de décision ministérielle.

## 🗂️ Documentation Complète
Pour comprendre chaque composant en détail, veuillez consulter les guides spécifiques ci-dessous :

1.  [**🏗️ Guide Docker**](./README_DOCKER.md) : Orchestration, déploiement et tests de l'infrastructure.
2.  [**🤖 Guide n8n**](./README_N8N.md) : Automatisation des pipelines ML, triggers et webhooks.
3.  [**🧠 Guide Backend**](./README_BACKEND.md) : Moteur d'IA, API Django et services de notification.
4.  [**📊 Guide Dashboard**](./README_FRONTEND.md) : Interface utilisateur Angular et aide à la décision.

---

## ⚡ Lancement Rapide

Assurez-vous que votre **MySQL (XAMPP)** est lancé, puis :

```bash
# Démarrer toute la plateforme
docker-compose up -d --build
```

**Accès directs :**
- **Dashboard** : [http://localhost:4200](http://localhost:4200)
- **API Status** : [http://localhost:8000/api/dashboard/automation/status/](http://localhost:8000/api/dashboard/automation/status/)
- **n8n Dashboard** : [http://localhost:5678](http://localhost:5678)

---

## 🧪 Résumé des Tests (Checklist)

| Composant | Action de Test | Résultat Attendu |
| :--- | :--- | :--- |
| **Docker** | `docker ps` | 3 conteneurs actifs (Up). |
| **Email** | POST `/api/dashboard/automation/test-email/` | Email reçu sur Gmail. |
| **n8n** | "Execute Workflow" dans n8n | Pipeline vert + Notification reçue. |
| **Dashboard** | Connexion ministre | Accès aux graphiques et simulations. |
| **Database** | Accès `/automation/status/` | JSON affichant les logs de la DB. |

---

> [!IMPORTANT]
> Toute la plateforme communique de manière sécurisée et centralisée. Pour toute modification majeure de l'IA, le pipeline n8n doit être redémarré en mode test pour valider les nouveaux modèles.
