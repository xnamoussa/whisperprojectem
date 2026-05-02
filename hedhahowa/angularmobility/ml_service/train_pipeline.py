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
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

# Configuration
DATA_SIZE = 1500
MODEL_PATH = "models"
os.makedirs(MODEL_PATH, exist_ok=True)

def generate_data(n=DATA_SIZE):
    """Génère un dataset simulé basé sur le notebook du projet."""
    np.random.seed(42)
    
    no2 = np.random.normal(35, 12, n)
    daily_traffic = np.random.exponential(40000, n) + 5000
    
  
    pm25 = 10 + (no2 * 0.4) + (daily_traffic / 15000) + np.random.normal(0, 3, n)
    
    df = pd.DataFrame({
        'city': np.random.choice(['Paris', 'Lyon', 'Marseille', 'Lille', 'Nice'], n),
        'station_type': np.random.choice(['Metro', 'Bus', 'Tram'], n),
        'lat': 45 + np.random.normal(0, 2, n),
        'lon': 2 + np.random.normal(0, 2, n),
        'connections': np.random.randint(1, 12, n),
        'daily_traffic': daily_traffic,
        'pm25': pm25,
        'no2': no2
    })
    
    df['hazard'] = (df['pm25'] > 28).astype(int)
    return df

import sqlite3

def _load_real_data_from_warehouse():
    """
    [MLOps Step 1]: Connects to the local Data Warehouse to extract real facts.
    """
    print("🔌 Connecting to datawhehousebi (1).sql...")
    
    try:
        # 1. Establish real database connection
        db_path = os.path.join(os.path.dirname(__file__), "..", "datawhehousebi (1).sql")
        conn = sqlite3.connect(db_path)
        
        query = """
            SELECT 
                f.col_traffic as daily_traffic, 
                f.col_no2 as no2, 
                f.col_pm25 as pm25, 
                f.col_connexions as connections, 
                c.col_ville as city, 
                s.col_type as station_type
            FROM fait_mobilite f
            JOIN dim_arret_mobilite s ON f.col_stop_id = s.col_stop_id
            JOIN dim_ville c ON s.col_ville = c.col_ville
            WHERE f.est_valide = 1
        """
        
        print("📥 Extracting rows from fait_mobilite...")
        real_df = pd.read_sql_query(query, conn)
        conn.close()

        if len(real_df) > 0:
            return real_df
            
    except Exception as e:

        pass
        
    return generate_data()

def train_and_track():
    import socket
    
    # Resolve 'mlflow' to IP to bypass MLflow 2.11+ DNS Rebinding validation
    tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    if "http://mlflow:" in tracking_uri:
        try:
            ip = socket.gethostbyname("mlflow")
            tracking_uri = tracking_uri.replace("mlflow", ip)
        except Exception:
            pass

    mlflow.set_tracking_uri(tracking_uri)
    print(f"📊 Tracking to MLflow at: {tracking_uri}")
    
    # Set MLflow experiment
    mlflow.set_experiment("Urban_Mobility_Risk_Prediction")

    print("🚀 Démarrage du pipeline d'entraînement (Comparaison de Modèles)...")
    
    # 1. Load Data
    df = _load_real_data_from_warehouse()
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
    
    # 3. Models to Compare (Extracted from ml_engine.py)
    models = {
        "LogisticRegression": {
            "model": LogisticRegression(max_iter=1200, C=1.0),
            "intuition": "Linear model estimating class probabilities via sigmoid. Great interpretable baseline.",
            "params": {"max_iter": 1200, "C": 1.0}
        },
        "RandomForestClassifier": {
            "model": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
            "intuition": "Ensemble of decision trees via majority vote. Handles non-linear relationships.",
            "params": {"n_estimators": 100, "max_depth": 10}
        },
        "GradientBoostingClassifier": {
            "model": GradientBoostingClassifier(n_estimators=80, learning_rate=0.1, max_depth=3, random_state=42),
            "intuition": "Sequential ensemble correcting previous mistakes. Often state-of-the-art accuracy.",
            "params": {"n_estimators": 80, "learning_rate": 0.1, "max_depth": 3}
        }
    }
    
    best_f1 = -1
    best_model_name = ""
    best_pipeline = None

    for model_name, info in models.items():
        print(f"\n⚙️ Entraînement: {model_name}...")
        
        with mlflow.start_run(run_name=model_name):
            # Tags for Model Understanding
            mlflow.set_tag("model_type", "Classification")
            mlflow.set_tag("algorithm", model_name)
            mlflow.set_tag("intuition", info["intuition"])
            
            pipeline = Pipeline([
                ('preprocessor', preprocessor),
                ('classifier', info["model"])
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
            for param_k, param_v in info["params"].items():
                mlflow.log_param(param_k, param_v)
            mlflow.log_metrics(metrics)
            
            # Log the model
            mlflow.sklearn.log_model(pipeline, "risk_model")
            
            print(f"✅ {model_name} - F1 Score: {metrics['f1_score']:.4f}")
            
            # Track best model for export
            if metrics["f1_score"] > best_f1:
                best_f1 = metrics["f1_score"]
                best_model_name = model_name
                best_pipeline = pipeline

    # Export best model
    if best_pipeline:
        print(f"\n🏆 Meilleur Modèle: {best_model_name} (F1: {best_f1:.4f})")
        model_filepath = os.path.join(MODEL_PATH, "risk_model.joblib")
        joblib.dump(best_pipeline, model_filepath)
        print(f"📦 Modèle sauvegardé dans {model_filepath}")

if __name__ == "__main__":
    train_and_track()
