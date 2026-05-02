# Week S13 Monitoring Next Steps

This file is the implementation plan for adding a production-like monitoring system with Prometheus and Grafana to this project.

## Goal

Add real monitoring for:
- API traffic and latency
- error rate
- model confidence and quality drift
- data freshness and missing values
- alerting
- production incident simulations

## Current Starting Point

Already available in the project:
- FastAPI inference API in `ml_service/main.py`
- training pipeline in `ml_service/train_pipeline.py`
- Django automation endpoints in `dashboards/views.py`
- drift logic in `dashboards/ml_automation.py`
- logs in `dashboards/logs/`
- notifications in `dashboards/notifications.py`
- Docker Compose stack in `docker-compose.yml`

Missing for S13:
- Prometheus instrumentation endpoint
- Prometheus service and config
- Grafana service and dashboard
- alert rules for latency, errors, drift, degradation
- baseline metric definitions exposed as metrics
- simulation scripts/endpoints for incidents

## Recommended Implementation Order

### 1. Instrument the FastAPI service
Primary file:
- `ml_service/main.py`

What to add:
- `/metrics` endpoint for Prometheus
- request count metric
- request latency metric
- request error count metric
- prediction class count metric
- prediction confidence metric
- model loaded gauge
- data quality metrics per request:
  - missing values count
  - freshness proxy
  - invalid input count if applicable

Why this first:
- this is the clearest production-style online inference service
- Angular already calls it directly
- it is the best source for real-time traffic, latency, error, and model-confidence metrics

### 2. Add monitoring helper logic
Recommended new file:
- `ml_service/monitoring.py`

What it should contain:
- Prometheus metric definitions
- baseline values for:
  - accuracy
  - latency
  - confidence
- helper functions to:
  - record request metrics
  - compute confidence summaries
  - expose drift/degradation gauges
  - update last-seen timestamps

This keeps `main.py` cleaner.

### 3. Expose drift and degradation metrics
Reuse current logic from:
- `dashboards/ml_automation.py`
- `dashboards/saved_models/*/baseline_stats.json`

What to add:
- a simple baseline config or JSON file with:
  - baseline accuracy
  - baseline latency
  - baseline confidence
- rules such as:
  - accuracy drop > 5%
  - confidence below baseline threshold
  - feature mean shift over threshold

Possible implementation:
- create a lightweight metrics state file read by FastAPI
- or expose a Django monitoring endpoint and have Prometheus scrape both services

Simplest path:
- start by tracking these metrics inside the FastAPI service
- reuse Django drift logic as input data for Prometheus gauges

### 4. Add Prometheus service
Recommended new files:
- `monitoring/prometheus/prometheus.yml`
- `monitoring/prometheus/alerts.yml`

Update:
- `docker-compose.yml`

Prometheus should:
- scrape every `10s` or `15s`
- scrape at least the FastAPI service
- optionally scrape Django too if you add Django metrics later
- load alerting rules from `alerts.yml`

Core alerts:
- high latency
- high error rate
- accuracy degradation
- drift detected
- confidence degradation

### 5. Add Grafana service
Recommended path:
- `monitoring/grafana/`

Update:
- `docker-compose.yml`

Grafana dashboard should include:
- Traffic:
  - requests over time
  - prediction volume
- Performance:
  - p95 or average latency
- Stability:
  - error rate
  - failed requests
- Model health:
  - confidence trend
  - accuracy vs baseline
- Data health:
  - missing values
  - freshness
  - drift flag

Important:
- make the dashboard tell a story from left to right:
  - "Is traffic rising?"
  - "Is the API still fast?"
  - "Are errors increasing?"
  - "Is the model still healthy?"
  - "Is the data drifting?"

### 6. Add simulation scenarios
Recommended new file:
- `ml_service/simulate_incidents.py`

Optional extra:
- dedicated dev/test endpoints in `ml_service/main.py`

Mandatory scenarios to support:
- high traffic -> repeated requests to `/predict`
- API errors -> intentionally invalid or failure-triggering requests
- model drift -> send shifted inputs with abnormal feature values

Outputs:
- visible changes in Prometheus metrics
- visible changes in Grafana charts
- logs proving the incident happened

### 7. Add alert logs / notifications
Reuse:
- `dashboards/notifications.py`
- `dashboards/logs/notifications.log`

Possible plan:
- Prometheus handles alert rule firing
- application also logs alert-worthy states
- keep at least file-based logs even if external notifications are not fully wired

Minimum acceptable S13 result:
- alert rules exist
- metrics clearly show breach conditions
- logs show anomalies or triggers

## Proposed File Plan

Likely files to create or edit next:

- Edit `ml_service/main.py`
  Add Prometheus instrumentation and `/metrics`.

- Create `ml_service/monitoring.py`
  Central place for metric definitions and baseline checks.

- Create `monitoring/prometheus/prometheus.yml`
  Scrape config.

- Create `monitoring/prometheus/alerts.yml`
  Prometheus alert rules.

- Create `monitoring/grafana/`
  Store dashboard export/provisioning files if needed.

- Edit `docker-compose.yml`
  Add Prometheus and Grafana services.

- Create `ml_service/simulate_incidents.py`
  Reproducible load/error/drift simulation helper.

- Optionally create `MONITORING_DEMO_CHECKLIST.md`
  Steps to demonstrate the required scenarios to your teacher.

## Suggested Metric List

### API metrics
- total requests
- requests by status code
- request latency
- active in-flight requests

### Model metrics
- predictions by class
- average confidence
- minimum confidence
- model loaded status
- accuracy vs baseline

### Data metrics
- missing feature count
- stale/fresh request timestamp
- drift detected flag
- per-feature drift score for important features like:
  - `daily_traffic`
  - `no2`
  - `connections`

### Incident metrics
- simulated traffic mode enabled
- simulated error mode enabled
- simulated drift mode enabled

## Suggested Baselines

Start with simple baseline values and adjust later:
- latency baseline: average prediction latency under normal load
- confidence baseline: average confidence from normal inference requests
- accuracy baseline: training/test accuracy from the current best model
- drift baseline: current feature means/std saved as baseline

## Definition Of Done

Week S13 is complete when you can demonstrate:
- `/metrics` is live
- Prometheus scrapes every 10 to 15 seconds
- Grafana dashboard shows traffic, latency, errors, model health, and data health
- drift/degradation detection metrics update correctly
- alert rules exist and are triggered by test scenarios
- logs show anomalies and retraining-related events
- three mandatory simulation scenarios are visible in monitoring

## Best Next Action

The best next coding step is:

1. instrument `ml_service/main.py`,
2. create `ml_service/monitoring.py`,
3. add Prometheus and Grafana to `docker-compose.yml`.

That gives the fastest path to visible S13 results.
