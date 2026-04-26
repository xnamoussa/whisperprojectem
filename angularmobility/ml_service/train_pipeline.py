import pandas as pd
import numpy as np
import os
import joblib
import mlflow
import mlflow.sklearn
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

# Configuration
DATA_SIZE = 1500
MODEL_PATH = "models"
os.makedirs(MODEL_PATH, exist_ok=True)

def generate_data(n=DATA_SIZE):
    """Génère un dataset simulé basé sur le notebook du projet."""
    np.random.seed(42)
    df = pd.DataFrame({
        'city': np.random.choice(['Paris', 'Lyon', 'Marseille', 'Lille', 'Nice'], n),
        'station_type': np.random.choice(['Metro', 'Bus', 'Tram'], n),
        'lat': 45 + np.random.normal(0, 2, n),
        'lon': 2 + np.random.normal(0, 2, n),
        'connections': np.random.randint(1, 12, n),
        'daily_traffic': np.random.exponential(40000, n) + 5000,
        'pm25': np.random.normal(18, 6, n),
        'no2': np.random.normal(35, 12, n)
    })
    
    # Target: High Risk if PM2.5 > 20
    df['hazard'] = (df['pm25'] > 20).astype(int)
    return df

def train_and_track():
    # Set MLflow experiment
    mlflow.set_experiment("Urban_Mobility_Risk_Prediction")

    with mlflow.start_run():
        print("🚀 Démarrage du pipeline d'entraînement...")
        
        # 1. Load Data
        df = generate_data()
        X = df.drop(['hazard', 'pm25'], axis=1)
        y = df['hazard']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # 2. Preprocessing
        num_features = ['lat', 'lon', 'connections', 'no2', 'daily_traffic']
        cat_features = ['city', 'station_type']
        
        preprocessor = ColumnTransformer([
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_features)
        ])
        
        # 3. Model Definition
        n_estimators = 100
        max_depth = 10
        model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
        
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
        
        # 4. Training
        pipeline.fit(X_train, y_train)
        
        # 5. Evaluation
        y_pred = pipeline.predict(X_test)
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "f1_score": f1_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred)
        }
        
        # 6. Logging to MLflow
        mlflow.log_param("n_estimators", n_estimators)
        mlflow.log_param("max_depth", max_depth)
        mlflow.log_metrics(metrics)
        
        # Log the model
        mlflow.sklearn.log_model(pipeline, "risk_model")
        
        # Save locally for FastAPI (fallback)
        joblib.dump(pipeline, os.path.join(MODEL_PATH, "risk_model.joblib"))
        
        print(f"✅ Entraînement terminé. F1 Score: {metrics['f1_score']:.4f}")
        print(f"📦 Modèle sauvegardé dans MLflow et {MODEL_PATH}/risk_model.joblib")

if __name__ == "__main__":
    train_and_track()
    # Run a second time for comparison
    with mlflow.start_run():
        print("\n🚀 Démarrage d'un second run pour comparaison...")
        df = generate_data()
        X = df.drop(['hazard', 'pm25'], axis=1)
        y = df['hazard']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        preprocessor = ColumnTransformer([
            ('num', StandardScaler(), ['lat', 'lon', 'connections', 'no2', 'daily_traffic']),
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['city', 'station_type'])
        ])
        model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
        pipeline = Pipeline([('preprocessor', preprocessor), ('classifier', model)])
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        mlflow.log_param("n_estimators", 50)
        mlflow.log_param("max_depth", 5)
        mlflow.log_metrics({"accuracy": accuracy_score(y_test, y_pred), "f1_score": f1_score(y_test, y_pred)})
        mlflow.sklearn.log_model(pipeline, "risk_model_v2")
        print(f"✅ Second run terminé.")
