import os
import time
from typing import Dict

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest


API_REQUESTS_TOTAL = Counter(
    "mobility_api_requests_total",
    "Total API requests handled by FastAPI",
    ["method", "endpoint", "status_code"],
)

API_REQUEST_LATENCY_SECONDS = Histogram(
    "mobility_api_request_latency_seconds",
    "Latency of API requests in seconds",
    ["method", "endpoint"],
    buckets=(0.01, 0.05, 0.1, 0.2, 0.35, 0.5, 1.0, 2.0, 5.0),
)

API_ERRORS_TOTAL = Counter(
    "mobility_api_errors_total",
    "Total API errors (status >= 400)",
    ["endpoint", "status_code"],
)

MODEL_LOADED = Gauge(
    "mobility_model_loaded",
    "Whether the FastAPI model is loaded (1=yes, 0=no)",
)

PREDICTIONS_TOTAL = Counter(
    "mobility_predictions_total",
    "Total predictions by risk level",
    ["risk_level"],
)

PREDICTION_CONFIDENCE = Histogram(
    "mobility_prediction_confidence",
    "Prediction confidence score",
    buckets=(0.0, 0.1, 0.2, 0.4, 0.6, 0.75, 0.85, 0.95, 1.0),
)

PREDICTION_CONFIDENCE_AVG = Gauge(
    "mobility_prediction_confidence_avg",
    "Rolling average prediction confidence",
)

DATA_MISSING_VALUES = Gauge(
    "mobility_data_missing_values",
    "Missing values count in last prediction payload",
)

DATA_FRESHNESS_SECONDS = Gauge(
    "mobility_data_freshness_seconds",
    "Seconds since last prediction request",
)

DATA_DRIFT_DETECTED = Gauge(
    "mobility_data_drift_detected",
    "Data drift flag based on threshold rules (1=yes, 0=no)",
)

DATA_DRIFT_FEATURES_COUNT = Gauge(
    "mobility_data_drift_features_count",
    "Number of drifted features in last request",
)

ACCURACY_BASELINE = Gauge(
    "mobility_accuracy_baseline",
    "Baseline model accuracy",
)
ACCURACY_CURRENT = Gauge(
    "mobility_accuracy_current",
    "Current observed model accuracy",
)
ACCURACY_DEGRADATION = Gauge(
    "mobility_accuracy_degradation",
    "Accuracy degradation flag if drop > 5% (1=yes, 0=no)",
)

LATENCY_BASELINE_SECONDS = Gauge(
    "mobility_latency_baseline_seconds",
    "Baseline latency target in seconds",
)
CONFIDENCE_BASELINE = Gauge(
    "mobility_confidence_baseline",
    "Baseline confidence target",
)
CONFIDENCE_DEGRADATION = Gauge(
    "mobility_confidence_degradation",
    "Confidence degradation flag (1=yes, 0=no)",
)

SIMULATED_TRAFFIC_MODE = Gauge(
    "mobility_simulated_traffic_mode",
    "Simulation switch for high traffic scenario",
)
SIMULATED_ERROR_MODE = Gauge(
    "mobility_simulated_error_mode",
    "Simulation switch for API error scenario",
)
SIMULATED_DRIFT_MODE = Gauge(
    "mobility_simulated_drift_mode",
    "Simulation switch for drift scenario",
)

_confidence_sum = 0.0
_confidence_count = 0
_last_prediction_ts = None
_accuracy_baseline_value = 0.90
_latency_baseline_value = 0.35
_confidence_baseline_value = 0.80
_accuracy_current_value = 0.90

# Simple baseline feature profile for drift rules (adjustable)
FEATURE_BASELINES: Dict[str, float] = {
    "daily_traffic": 45000.0,
    "no2": 35.0,
    "connections": 5.0,
}


def initialize_baselines() -> None:
    global _accuracy_baseline_value, _latency_baseline_value, _confidence_baseline_value, _accuracy_current_value
    accuracy_baseline = float(os.getenv("MOBILITY_ACCURACY_BASELINE", "0.90"))
    latency_baseline = float(os.getenv("MOBILITY_LATENCY_BASELINE_SECONDS", "0.35"))
    confidence_baseline = float(os.getenv("MOBILITY_CONFIDENCE_BASELINE", "0.80"))
    accuracy_current = float(os.getenv("MOBILITY_ACCURACY_CURRENT", str(accuracy_baseline)))
    _accuracy_baseline_value = accuracy_baseline
    _latency_baseline_value = latency_baseline
    _confidence_baseline_value = confidence_baseline
    _accuracy_current_value = accuracy_current

    ACCURACY_BASELINE.set(accuracy_baseline)
    LATENCY_BASELINE_SECONDS.set(latency_baseline)
    CONFIDENCE_BASELINE.set(confidence_baseline)
    ACCURACY_CURRENT.set(accuracy_current)

    ACCURACY_DEGRADATION.set(1 if (accuracy_baseline - accuracy_current) > 0.05 else 0)
    CONFIDENCE_DEGRADATION.set(0)
    DATA_DRIFT_DETECTED.set(0)
    DATA_DRIFT_FEATURES_COUNT.set(0)
    SIMULATED_TRAFFIC_MODE.set(0)
    SIMULATED_ERROR_MODE.set(0)
    SIMULATED_DRIFT_MODE.set(0)


def mark_model_loaded(is_loaded: bool) -> None:
    MODEL_LOADED.set(1 if is_loaded else 0)


def update_request_metrics(method: str, endpoint: str, status_code: int, elapsed_seconds: float) -> None:
    API_REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status_code=str(status_code)).inc()
    API_REQUEST_LATENCY_SECONDS.labels(method=method, endpoint=endpoint).observe(elapsed_seconds)
    if status_code >= 400:
        API_ERRORS_TOTAL.labels(endpoint=endpoint, status_code=str(status_code)).inc()


def update_prediction_metrics(risk_level: str, confidence: float, missing_values: int) -> None:
    global _confidence_sum, _confidence_count, _last_prediction_ts

    PREDICTIONS_TOTAL.labels(risk_level=risk_level).inc()
    PREDICTION_CONFIDENCE.observe(confidence)
    DATA_MISSING_VALUES.set(missing_values)

    _confidence_sum += confidence
    _confidence_count += 1
    PREDICTION_CONFIDENCE_AVG.set(_confidence_sum / _confidence_count)

    CONFIDENCE_DEGRADATION.set(1 if confidence < _confidence_baseline_value else 0)

    now = time.time()
    if _last_prediction_ts is None:
        DATA_FRESHNESS_SECONDS.set(0)
    else:
        DATA_FRESHNESS_SECONDS.set(max(0.0, now - _last_prediction_ts))
    _last_prediction_ts = now


def evaluate_drift(payload: Dict[str, float], relative_threshold: float = 0.30) -> Dict[str, float]:
    drifted = 0
    for feature, baseline in FEATURE_BASELINES.items():
        value = float(payload.get(feature, baseline))
        if baseline == 0:
            changed = abs(value) > 0
        else:
            changed = abs(value - baseline) / abs(baseline) > relative_threshold
        if changed:
            drifted += 1

    DATA_DRIFT_FEATURES_COUNT.set(drifted)
    DATA_DRIFT_DETECTED.set(1 if drifted > 0 else 0)
    return {"drift_detected": drifted > 0, "drifted_features_count": drifted}


def set_simulation_flags(traffic: int = 0, error: int = 0, drift: int = 0) -> None:
    SIMULATED_TRAFFIC_MODE.set(1 if traffic else 0)
    SIMULATED_ERROR_MODE.set(1 if error else 0)
    SIMULATED_DRIFT_MODE.set(1 if drift else 0)


def render_metrics():
    return generate_latest(), CONTENT_TYPE_LATEST


def get_baselines() -> Dict[str, float]:
    return {
        "accuracy": _accuracy_baseline_value,
        "latency_seconds": _latency_baseline_value,
        "confidence": _confidence_baseline_value,
        "accuracy_current": _accuracy_current_value,
    }


def set_accuracy_current(accuracy_value: float) -> Dict[str, float]:
    global _accuracy_current_value
    _accuracy_current_value = accuracy_value
    ACCURACY_CURRENT.set(accuracy_value)
    ACCURACY_DEGRADATION.set(1 if (_accuracy_baseline_value - accuracy_value) > 0.05 else 0)
    return {
        "accuracy_baseline": _accuracy_baseline_value,
        "accuracy_current": _accuracy_current_value,
        "accuracy_degradation": 1.0 if (_accuracy_baseline_value - accuracy_value) > 0.05 else 0.0,
    }
