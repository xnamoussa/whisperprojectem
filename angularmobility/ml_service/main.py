from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Urban Mobility Risk API")

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

# Load model at startup
@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
    else:
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
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict")
def predict(input_data: PredictionInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    data = pd.DataFrame([input_data.dict()])
    
    try:
        prediction = model.predict(data)[0]
        probability = model.predict_proba(data)[0].tolist()
        
        return {
            "prediction": int(prediction),
            "risk_level": "High" if prediction == 1 else "Low",
            "probability": probability
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
