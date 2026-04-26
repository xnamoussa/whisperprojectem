import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier, XGBRegressor
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Configuration
SAVE_DIR = "saved_models"
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

def generate_mock_data():
    """Génère des données factices pour l'entraînement initial."""
    X = np.random.rand(100, 10)
    y_cls = np.random.randint(0, 2, 100)
    y_reg = np.random.rand(100)
    return X, y_cls, y_reg

def save_all_models():
    print(f"🚀 Démarrage de la sauvegarde des modèles dans '{SAVE_DIR}'...")
    X, y_cls, y_reg = generate_mock_data()

    # 1. Scaler
    scaler = StandardScaler()
    scaler.fit(X)
    joblib.dump(scaler, os.path.join(SAVE_DIR, "scaler.joblib"))
    print("✅ Scaler sauvegardé.")

    # 2. Classification Models
    rf_cls = RandomForestClassifier(n_estimators=100)
    rf_cls.fit(X, y_cls)
    joblib.dump(rf_cls, os.path.join(SAVE_DIR, "rf_classifier.joblib"))

    xgb_cls = XGBClassifier()
    xgb_cls.fit(X, y_cls)
    joblib.dump(xgb_cls, os.path.join(SAVE_DIR, "xgb_classifier.joblib"))
    print("✅ Modèles de Classification sauvegardés.")

    # 3. Regression Models
    rf_reg = RandomForestRegressor(n_estimators=100)
    rf_reg.fit(X, y_reg)
    joblib.dump(rf_reg, os.path.join(SAVE_DIR, "rf_regressor.joblib"))

    xgb_reg = XGBRegressor()
    xgb_reg.fit(X, y_reg)
    joblib.dump(xgb_reg, os.path.join(SAVE_DIR, "xgb_regressor.joblib"))
    print("✅ Modèles de Régression sauvegardés.")

    # 4. Clustering
    kmeans = KMeans(n_clusters=3, n_init=10)
    kmeans.fit(X)
    joblib.dump(kmeans, os.path.join(SAVE_DIR, "kmeans_clustering.joblib"))
    print("✅ Modèle de Clustering sauvegardé.")

    print(f"\n✨ Terminé ! Tous les modèles sont disponibles dans le dossier '{SAVE_DIR}'.")

if __name__ == "__main__":
    save_all_models()
