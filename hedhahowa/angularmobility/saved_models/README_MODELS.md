# 📘 Guide Technique : Modèles ML Exportés (Urbain Mobility)

Ce document explique en détail les choix technologiques et le fonctionnement des modèles sauvegardés dans ce dossier.

---

## 🚀 1. XGBoost (Extreme Gradient Boosting)
*Fichiers : `xgb_classifier.joblib`, `xgb_regressor.joblib`*

### ✅ Pourquoi ce choix ?
XGBoost est considéré comme la "Formule 1" du Machine Learning pour les données tabulaires. Il a été choisi pour :
- **Sa Précision :** Capacité inégalée à minimiser les erreurs complexes dans les flux de trafic.
- **Sa Rapidité :** Optimisé pour le calcul parallèle, ce qui est crucial pour les prédictions instantanées.

### ⚙️ Fonctionnement
Il utilise le **Boosting de Gradient**. Imaginez une équipe de coureurs où chaque coureur (un arbre de décision) essaie de rattraper uniquement la distance manquée par le coureur précédent. Au final, la somme de tous les coureurs donne un résultat extrêmement proche de la cible.

---

## 🌲 2. Random Forest (Forêt Aléatoire)
*Fichiers : `rf_classifier.joblib`, `rf_regressor.joblib`*

### ✅ Pourquoi ce choix ?
C'est le modèle de la **stabilité**. Il a été choisi pour :
- **La Robustesse :** Il ne se laisse pas tromper par des données aberrantes (comme une panne de capteur isolée).
- **L'Équilibre :** Il est moins sensible au "sur-apprentissage" (overfitting) que d'autres modèles plus nerveux.

### ⚙️ Fonctionnement
C'est la démocratie appliquée aux données (technique de **Bagging**). Des centaines d'arbres de décision votent de manière indépendante. Le résultat final est la moyenne (ou la majorité) de tous les votes. Cela réduit considérablement le risque d'erreur.

---

## 📍 3. K-Means (Clustering)
*Fichier : `kmeans_clustering.joblib`*

### ✅ Pourquoi ce choix ?
Parfait pour l'**analyse géographique**. Il a été choisi pour :
- **La Segmentation :** Identifier automatiquement les zones qui ont des comportements de mobilité similaires sans qu'on ait besoin de leur donner d'étiquettes.

### ⚙️ Fonctionnement
Il place des "points d'intérêt" (centroïdes) au milieu des données et demande à chaque point de se rattacher au centre le plus proche. Il déplace ensuite les centres jusqu'à ce que les groupes soient les plus compacts possible.

---

## 📏 4. StandardScaler (Le Normalisateur)
*Fichier : `scaler.joblib`*

### ✅ Pourquoi ce choix ?
Les algorithmes d'IA n'aiment pas les différences d'échelle (mélanger des km/h avec des pourcentages de pollution par exemple).
- **Égalité :** Il s'assure que chaque variable a le même poids dans le calcul final.

### ⚙️ Fonctionnement
Il transforme chaque donnée pour que la moyenne soit **0** et l'écart-type soit **1**.

---

## 💻 Comment utiliser ces modèles ?

Voici un exemple de code Python pour charger et tester un modèle :

```python
import joblib

# 1. Charger le scaler et le modèle
scaler = joblib.load('saved_models/scaler.joblib')
model = joblib.load('saved_models/xgb_classifier.joblib')

# 2. Préparer une nouvelle donnée (exemple : 10 caractéristiques)
new_data = [[0.5, 0.2, 0.8, 0.1, 0.9, 0.4, 0.3, 0.7, 0.6, 0.5]]

# 3. Normaliser et prédire
scaled_data = scaler.transform(new_data)
prediction = model.predict(scaled_data)

print(f"Prédiction du modèle : {prediction}")
```
