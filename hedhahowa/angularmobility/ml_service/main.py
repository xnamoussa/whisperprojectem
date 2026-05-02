import os
import time
import logging
import logging.handlers

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from monitoring import (
    evaluate_drift,
    get_baselines,
    initialize_baselines,
    mark_model_loaded,
    render_metrics,
    set_accuracy_current,
    set_simulation_flags,
    update_prediction_metrics,
    update_request_metrics,
)

app = FastAPI(title="Urban Mobility Risk API")

# --- Logging setup: stdout + rotating file ---
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "ml_api.log")

_fmt = logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s")
_file_handler = logging.handlers.RotatingFileHandler(
    LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
)
_file_handler.setFormatter(_fmt)
_stream_handler = logging.StreamHandler()
_stream_handler.setFormatter(_fmt)

logging.basicConfig(level=logging.INFO, handlers=[_stream_handler, _file_handler])
logger = logging.getLogger("mobility_ml_api")

# Enable CORS for Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "models/risk_model.joblib"
model = None


@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    start = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        elapsed = time.perf_counter() - start
        update_request_metrics(
            method=request.method,
            endpoint=request.url.path,
            status_code=status_code,
            elapsed_seconds=elapsed,
        )


# Load model at startup
@app.on_event("startup")
def load_model():
    global model
    initialize_baselines()
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        mark_model_loaded(True)
        print(f"✅ Model loaded from {MODEL_PATH}")
    else:
        mark_model_loaded(False)
        print(f"❌ Model not found at {MODEL_PATH}")

class PredictionInput(BaseModel):
    city: str
    station_type: str
    lat: float
    lon: float
    connections: int
    daily_traffic: float
    no2: float

@app.get("/")
def read_root():
    return {"message": "Urban Mobility Risk Prediction API is running"}

@app.get("/health")
def health_check():
    baselines = get_baselines()
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "baselines": {
            "accuracy": baselines["accuracy"],
            "latency_seconds": baselines["latency_seconds"],
            "confidence": baselines["confidence"],
        },
    }


@app.get("/metrics")
def metrics():
    content, content_type = render_metrics()
    return Response(content=content, media_type=content_type)


@app.post("/monitoring/baseline")
def update_monitoring_baseline(payload: dict):
    baselines = get_baselines()
    accuracy = float(payload.get("accuracy_current", baselines["accuracy_current"]))
    updated = set_accuracy_current(accuracy)
    return {
        "status": "updated",
        "accuracy_baseline": updated["accuracy_baseline"],
        "accuracy_current": updated["accuracy_current"],
        "accuracy_degradation": bool(updated["accuracy_degradation"]),
    }

@app.post("/predict")
def predict(input_data: PredictionInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    data = pd.DataFrame([input_data.dict()])
    missing_values = int(data.isna().sum().sum())

    try:
        prediction = model.predict(data)[0]
        probability = model.predict_proba(data)[0].tolist()
        confidence = float(max(probability))
        risk_level = "High" if prediction == 1 else "Low"

        drift_info = evaluate_drift(
            {
                "daily_traffic": float(input_data.daily_traffic),
                "no2": float(input_data.no2),
                "connections": float(input_data.connections),
            }
        )
        if drift_info["drift_detected"]:
            n_drifted = drift_info["drifted_features_count"]
            logger.warning(
                "DATA DRIFT DETECTED — %d feature(s) shifted beyond threshold. "
                "RETRAINING TRIGGER: consider scheduling a new training run.",
                n_drifted,
            )
            logger.info(
                "ANOMALY — drift payload values: daily_traffic=%.1f, no2=%.1f, connections=%d",
                float(input_data.daily_traffic),
                float(input_data.no2),
                int(input_data.connections),
            )

        update_prediction_metrics(
            risk_level=risk_level,
            confidence=confidence,
            missing_values=missing_values,
        )

        return {
            "prediction": int(prediction),
            "risk_level": risk_level,
            "probability": probability,
            "confidence": confidence,
            "drift_detected": drift_info["drift_detected"],
            "drifted_features_count": drift_info["drifted_features_count"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/monitoring/simulation-mode")
def set_monitoring_simulation_mode(payload: dict):
    traffic = int(payload.get("traffic", 0))
    error = int(payload.get("error", 0))
    drift = int(payload.get("drift", 0))
    set_simulation_flags(traffic=traffic, error=error, drift=drift)
    return {"status": "ok", "traffic": traffic, "error": error, "drift": drift}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
