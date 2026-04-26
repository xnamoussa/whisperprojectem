# 🏗️ Guide Docker — Urbain Mobility Analytics

Ce document explique le rôle de l'infrastructure Docker et comment valider son bon fonctionnement.

## 📋 Rôle de Docker
Docker gère l'orchestration complète de la plateforme en isolant chaque service dans des conteneurs dédiés :

1.  **`mobility-backend` (Django)** : Le cerveau du projet. Il gère l'API, les modèles de Machine Learning, les notifications par email et la connexion à la base de données MySQL.
2.  **`mobility-frontend` (Angular)** : L'interface utilisateur ministérielle.
3.  **`mobility-n8n` (Workflow Automation)** : Le moteur d'automatisation qui pilote les pipelines ML.

---

## 🚀 Quand Docker agit-il ?
Docker agit dès le lancement de la commande `docker-compose up`. 
Au démarrage :
- Il configure les réseaux internes pour que les services communiquent.
- Il connecte le backend à votre **MySQL XAMPP** via `host.docker.internal`.
- Il exécute automatiquement les **migrations** et le **seeding** des utilisateurs ministres.

---

## 🧪 Comment tester Docker ?

### 1. Vérifier l'état des services
Ouvrez un terminal dans le dossier du projet et tapez :
```bash
docker ps
```
**Résultat attendu** : Vous devez voir 3 conteneurs avec le statut `Up` (et `healthy` pour le backend).

### 2. Vérifier les Logs (Traceabilité)
Pour voir ce qui se passe en temps réel dans le backend :
```bash
docker logs -f mobility-backend
```
*Si vous voyez "Gunicorn starting", tout est parfait.*

### 3. Tester la connectivité Database
Si le backend est marqué comme `healthy`, cela signifie qu'il a réussi à se connecter à votre MySQL sur XAMPP. Vous pouvez aussi tester l'URL :
`http://localhost:8000/api/dashboard/automation/status/`
Si vous recevez du JSON, la connexion DB est active.

### 4. Redémarrage Propre
Si vous modifiez une configuration :
```bash
docker-compose down
docker-compose up -d --build
```
