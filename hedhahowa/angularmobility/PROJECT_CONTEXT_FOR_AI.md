# Project Context For AI

This file is a quick project briefing you can paste into another AI chat so it understands the codebase fast.

## What This Project Is

This is a multi-service urban mobility analytics platform with:
- a Django backend API,
- an Angular frontend dashboard,
- a FastAPI ML inference service,
- MLflow for experiment tracking,
- n8n automation hooks,
- Docker Compose orchestration.

The project mixes two ML layers:
1. `ml_service/` for the Week S12-style training pipeline and production-like inference API.
2. `dashboards/` for Django-side analytical ML, retraining, inference automation, drift checks, logs, and notifications.

## Main Runtime Services

Defined in `docker-compose.yml`:
- `backend` -> Django app on port `8000`
- `frontend` -> Angular app on port `4200`
- `n8n` -> workflow automation on port `5678`
- `ml-api` -> FastAPI model API on port `8001` (container port `8000`)
- `mlflow` -> MLflow UI/server on port `5000`

## Main Folders

- `backend/`
  Django project config (`settings.py`, `urls.py`, ASGI/WSGI).

- `accounts/`
  Authentication/user module.

- `dashboards/`
  Main Django app for dashboards, ministry ML analysis, automation, drift checks, notifications, logs, and saved models.

- `frontend/`
  Angular UI.

- `ml_service/`
  FastAPI inference API, ML training pipeline, MLflow artifacts, and exported model files.

- `saved_models/`
  Additional saved artifacts at repo level.

- `assets/`
  Static or project assets.

## Most Important Files

### Core orchestration
- `docker-compose.yml`
  Main multi-service orchestration file.

- `README.md`
  High-level launch notes and links to other docs.

### Django backend
- `backend/settings.py`
  Django settings, database config, CORS, logging, email config.

- `backend/urls.py`
  Root URL routing:
  - auth routes under `/api/auth/`
  - dashboard routes under `/api/dashboard/`

### Auth
- `accounts/views.py`
  Current user endpoint.

- `accounts/urls.py`
  Auth-related route wiring.

### Django dashboard + ML automation
- `dashboards/views.py`
  Key Django API endpoints:
  - ministry dashboard data
  - ministry ML report
  - prediction scenarios and instant predictions
  - automation status
  - retrain trigger
  - inference trigger
  - drift check
  - notification logs
  - test email

- `dashboards/urls.py`
  Routes for all dashboard and automation endpoints.

- `dashboards/ml_engine.py`
  Big analytical engine used by Django dashboard.
  Contains:
  - synthetic or DB-backed data preparation
  - classification
  - regression
  - clustering
  - time series forecasting
  - advanced objectives (NLP, anomaly detection, deep learning mock/reporting, RL mock)

- `dashboards/ml_automation.py`
  Important for MLOps-like behavior already present.
  Contains:
  - `run_pipeline()` for retraining all ministries
  - `run_inference_pipeline()` for automated inference
  - `check_data_drift()` for baseline-vs-current drift checks
  - model persistence under `dashboards/saved_models/<ministry>/`
  - JSON logging to automation/inference logs

- `dashboards/notifications.py`
  Notification service for:
  - email alerts
  - Slack webhook notifications
  - notification logging

- `dashboards/logs/app.log`
  Application logs.

- `dashboards/logs/ml_engine.log`
  ML and automation logs.

- `dashboards/logs/notifications.log`
  Notification trace log.

- `dashboards/saved_models/`
  Django-side saved models and metadata.
  Per ministry folders contain things like:
  - `model_version.json`
  - `baseline_stats.json`

### FastAPI ML service
- `ml_service/main.py`
  FastAPI app for industrialized inference.
  Main endpoints:
  - `GET /`
  - `GET /health`
  - `POST /predict`

- `ml_service/train_pipeline.py`
  Main training pipeline for the risk model.
  Responsibilities:
  - load/generate data
  - preprocess features
  - compare multiple classifiers
  - log runs to MLflow
  - export the best model

- `ml_service/models/risk_model.joblib`
  Exported model used by the FastAPI service.

- `ml_service/Dockerfile`
  Container build for the FastAPI service.

- `ml_service/mlruns/`
  MLflow artifacts/runs stored locally for the ML service.

### Frontend
- `frontend/src/app/pages/dashboard.component.ts`
  Main Angular dashboard page. Handles:
  - ministry dashboard loading
  - ML visualizations
  - prediction scenarios
  - industrial inference tab (`mlops`)

- `frontend/src/app/services/dashboard.service.ts`
  Main Angular API service. Calls:
  - Django backend on `http://localhost:8000/api`
  - FastAPI inference service on `http://localhost:8001/predict`

- `frontend/src/app/services/chart.service.ts`
  Chart rendering helper.

- `frontend/src/app/app.routes.ts`
  Angular routes.

- `frontend/package.json`
  Angular scripts and frontend dependencies.

## Main API Endpoints

### Django
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

- `GET /api/dashboard/<ministry>/`
- `GET /api/dashboard/<ministry>/ml/`
- `GET /api/dashboard/<ministry>/predictions/scenarios/`
- `POST /api/dashboard/<ministry>/predictions/run/`
- `POST /api/dashboard/<ministry>/predictions/export/`

- `GET /api/dashboard/automation/status/`
- `POST /api/dashboard/automation/retrain/`
- `POST /api/dashboard/automation/inference/`
- `POST /api/dashboard/automation/webhook/`
- `POST /api/dashboard/automation/drift/`
- `GET /api/dashboard/automation/notifications/`
- `POST /api/dashboard/automation/test-email/`

### FastAPI
- `GET http://localhost:8001/`
- `GET http://localhost:8001/health`
- `POST http://localhost:8001/predict`

## ML / Data Flow

### Flow 1: Week S12 risk model
1. `ml_service/train_pipeline.py` trains several classifiers.
2. Metrics and artifacts are logged to MLflow.
3. Best model is exported to `ml_service/models/risk_model.joblib`.
4. `ml_service/main.py` loads that model at startup.
5. Angular calls `http://localhost:8001/predict` from the "IA Industrialisée" tab.

### Flow 2: Django analytical ML
1. Angular requests ministry ML data from Django.
2. `dashboards/views.py` calls `run_ministry_ml_report()` in `dashboards/ml_engine.py`.
3. Results feed charts for classification, regression, clustering, forecasting, NLP, etc.

### Flow 3: Automation / retraining / drift
1. n8n or manual calls hit Django automation endpoints.
2. `dashboards/ml_automation.py` runs retraining or inference jobs.
3. Results are saved as JSON logs and model artifacts.
4. Notifications and logs are emitted.
5. Drift checks compare current stats against `baseline_stats.json`.

## Existing MLOps/Monitoring-Adjacent Pieces

Already present:
- MLflow experiment tracking
- retraining triggers
- inference pipeline triggers
- drift check endpoint
- rotating logs
- notification logging
- email/Slack alert utilities
- health endpoint for FastAPI

Not yet clearly implemented for Week S13:
- Prometheus `/metrics` exposure
- Prometheus scrape configuration
- Grafana dashboard for S13 KPIs
- Prometheus alert rules
- production-style latency/error/request metrics
- model confidence/accuracy baseline monitoring in Prometheus
- explicit simulation scripts for traffic spikes, API errors, and model drift

## Useful Commands

### Start everything
```bash
docker-compose up -d --build
```

### Run FastAPI training pipeline inside the ML API container
```bash
docker exec mobility-ml-api python train_pipeline.py
```

### Access apps
- Frontend: `http://localhost:4200`
- Django backend status: `http://localhost:8000/api/dashboard/automation/status/`
- FastAPI docs: `http://localhost:8001/docs`
- MLflow: `http://localhost:5000`
- n8n: `http://localhost:5678`

## Important Notes For Another AI

- The repo contains hardcoded secrets and email credentials in some files. Do not repeat or copy those values into new docs or commits.
- For Week S13 monitoring, the best place to instrument first is likely `ml_service/main.py` because it is the real online inference API and already has `/health` and `/predict`.
- The Django side already has drift, automation, logs, and notifications that can be reused instead of rebuilt.
