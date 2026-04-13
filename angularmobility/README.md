# 🚀 SASA Mobility Analytics : Le Guide Complet (Full Technical Readme)

**SASA Mobility** est une plateforme de support à la décision ministérielle basée sur l'Intelligence Artificielle. Ce projet fusionne le Machine Learning, le Deep Learning et le Traitement du Langage Naturel (NLP) pour piloter la mobilité urbaine du futur.

---

## 🏗️ 1. Architecture du Projet

Le projet suit un pattern **Client-Serveur** moderne :
- **Backend (Django) :** Agit comme le "Cerveau". Il calcule les modèles, gère la base de données et sécurise les accès.
- **Frontend (Angular) :** Agit comme le "Visage". Il présente les données de manière esthétique (Glassmorphism) et interactive.

### 📁 Structure des Répertoires
```text
angularmobility/
├── backend/               # Configuration Django & Sécurité
├── dashboards/            # LOGIQUE IA (Le cœur du projet)
│   ├── ml_engine.py       # Algorithmes ML, DL, TS et NLP
│   ├── chatbot_service.py # Intelligence conversationnelle
│   └── views.py           # Endpoints API REST
├── accounts/              # Gestion des Ministres & Auth JWT
├── frontend/              # Interface utilisateur Angular
│   └── src/app/pages/     # Dashboards interactils & Login
└── README.md              # Ce document
```

---

## 🧠 2. Deep Dive : Intelligence Artificielle

### A. Le Moteur ML (`ml_engine.py`)
C'est ici que la magie opère. Le code est structuré pour comparer systématiquement plusieurs modèles. 

**Exemple de logique :**
```python
# Extrait simplifié de la logique de comparaison
best_model = max(models, key=lambda m: m["metrics"].get("val_accuracy", 0))
```
*Explication :* Le système entraîne plusieurs modèles (CNN, LSTM, etc.) et sélectionne automatiquement celui qui a la meilleure précision sur les données de validation pour le présenter au Ministre.

### B. NLP & Analyse de Sentiment
Nous utilisons des techniques de pointe pour écouter les citoyens :
- **Topic Modeling (LDA) :** Identifie si les gens parlent de "Retards" ou de "Sécurité".
- **NER :** Extrait les lieux comme "Paris" ou "Gare du Nord".

---

## ⚡ 3. Fonctionnalités & Exemples de Code

### 🛡️ Sécurité & Rôles Ministériels
Chaque utilisateur est rattaché à un ministère. Le backend filtre les données dynamiquement :
```python
# accounts/models.py
class User(AbstractUser):
    ministry = models.CharField(max_length=50, choices=MINISTRY_CHOICES)
```

### 💎 Design System (Glassmorphism)
L'interface utilise des flous sophistiqués pour un rendu premium :
```scss
/* frontend/src/app/pages/dashboard.component.scss */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 🤖 Chatbot Intelligent (Gemini RAG)
Le chatbot ne se contente pas de discuter, il connaît les données du projet :
- **Technologie :** RAG (Retrieval Augmented Generation).
- **Modèle :** Google Gemini 1.5 Pro.

---

## 🎯 4. Guide des Modèles IA (Résumé)

| Catégorie | Modèle Clé | Utilité Concrète |
| :--- | :--- | :--- |
| **Vision** | CNN | Compter les véhicules sur les caméras de surveillance. |
| **Mémoire** | LSTM | Prédire le trafic de demain en se basant sur hier. |
| **Complexité** | Transformers | Corréler Météo, Trafic et Incidents en temps réel. |
| **Opinion** | Sentiment Analysis | Connaître l'humeur des usagers des transports. |

---

## 🚀 5. Installation & Déploiement

### Étape 1 : Préparation du Cerveau (Backend)
1. Installez les dépendances : `pip install -r requirements.txt`
2. Lancez les migrations : `python manage.py migrate`
3. **Important :** Créez les ministres : `python manage.py seed_ministers`
4. Démarrez : `python manage.py runserver`

### Étape 2 : Lancement de l'Interface (Frontend)
1. Installez Node : `npm install`
2. Démarrez l'app : `ng serve`
3. Accédez à `http://localhost:4200`

---

## 🔑 6. Accès de Test (Credentials)
- **Ministre de l'Intérieur :** `Ayed.rayen@esprit.tn` / `Realmadridftw123.`
- **Ministre des Transports :** `ministre.transport` / `sasa2026`
- **Administrateur Global :** `admin` / `admin2026`

---
*Ce projet est une démonstration de la convergence entre Data Science, Ingénierie logicielle et Design UI de luxe.*
