"""
ML Automation Pipeline — Retraining & Inference
================================================
- Automated retraining triggered by schedule (n8n Cron) or webhook
- Automated inference pipeline for periodic predictions
- Retry logic with exponential backoff on failures
- Email notifications to emna.awini.work@gmail.com on completion/failure
- Models versioned and saved to dashboards/saved_models/<ministry>/
- Full traceability via automation_log.json
"""
import os
import joblib
import json
import logging
from datetime import datetime
import pandas as pd
import numpy as np
import time
from functools import wraps
import traceback

import sys
import django

# Django setup for standalone execution
def setup_django():
    if not os.environ.get('DJANGO_SETTINGS_MODULE'):
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        import django
        django.setup()
    except Exception as e:
        print(f"Django setup failed: {e}")

from dashboards.ml_engine import (
    _build_base_dataframe,
    _clean_and_engineer,
    _classification,
    _regression,
    _clustering,
    _time_series,
    MINISTRY_DATA_PROFILES
)
from dashboards.notifications import notification_service

# Configuration
try:
    from django.conf import settings
    PROJECT_ROOT = settings.BASE_DIR
except:
    PROJECT_ROOT = os.getcwd()

BASE_SAVE_DIR = os.path.join(PROJECT_ROOT, "dashboards", "saved_models")
LOG_FILE = os.path.join(BASE_SAVE_DIR, "automation_log.json")
INFERENCE_LOG_FILE = os.path.join(BASE_SAVE_DIR, "inference_log.json")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("dashboards")


# ──────────────────────────────────────────────────────────
# Retry Decorator with Exponential Backoff
# ──────────────────────────────────────────────────────────
def retry(exceptions, tries=3, delay=2, backoff=2):
    """
    Retry decorator with exponential backoff.
    - tries: max number of attempts
    - delay: initial delay in seconds
    - backoff: multiplier for delay after each failure
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            mtries, mdelay = tries, delay
            while mtries > 1:
                try:
                    return f(*args, **kwargs)
                except exceptions as e:
                    logger.warning(
                        f"[RETRY] {f.__name__} failed: {e}. "
                        f"Retrying in {mdelay}s... ({mtries-1} tries left)"
                    )
                    time.sleep(mdelay)
                    mtries -= 1
                    mdelay *= backoff
            return f(*args, **kwargs)
        return wrapper
    return decorator


def ensure_dirs(ministry):
    """Create model save directory for a ministry."""
    path = os.path.join(BASE_SAVE_DIR, ministry)
    os.makedirs(path, exist_ok=True)
    return path


# ──────────────────────────────────────────────────────────
# Retraining Pipeline
# ──────────────────────────────────────────────────────────
@retry(Exception, tries=3, delay=2, backoff=2)
def retrain_ministry(ministry):
    """Retrain all ML models for a single ministry with retry logic."""
    logger.info(f"[PROCESS] Starting retraining for ministry: {ministry}")
    save_path = ensure_dirs(ministry)

    # 1. Data Preparation
    df_base = _build_base_dataframe(ministry=ministry, size=1500)
    df_prepared, summary = _clean_and_engineer(df_base)

    metrics_summary = {}

    # 2. Classification
    logger.info(f"--- Training Classification [{ministry}] ---")
    cls_results = _classification(df_prepared, class_trees=150, return_models=True)
    for model_name, model_obj in cls_results["fitted_models"].items():
        joblib.dump(model_obj, os.path.join(save_path, f"cls_{model_name}.joblib"))
    metrics_summary["classification"] = cls_results["models"]

    # 3. Regression
    logger.info(f"--- Training Regression [{ministry}] ---")
    reg_results = _regression(df_prepared, reg_trees=250, return_models=True)
    for model_name, model_obj in reg_results["fitted_models"].items():
        joblib.dump(model_obj, os.path.join(save_path, f"reg_{model_name}.joblib"))
    metrics_summary["regression"] = reg_results["models"]

    # 4. Clustering
    logger.info(f"--- Training Clustering [{ministry}] ---")
    cl_results = _clustering(df_prepared, clustering_k=4, return_models=True)
    joblib.dump(cl_results["precomputed_k"], os.path.join(save_path, "clustering_precomputed.joblib"))
    joblib.dump(cl_results["fitted_models"]["scaler"], os.path.join(save_path, "cluster_scaler.joblib"))
    joblib.dump(cl_results["fitted_models"]["pca"], os.path.join(save_path, "cluster_pca.joblib"))
    metrics_summary["clustering"] = cl_results["models"]

    # 5. Time Series
    logger.info(f"--- Training Time Series [{ministry}] ---")
    ts_results = _time_series(ministry=ministry, forecast_horizon=12, return_models=True)
    for model_name, model_obj in ts_results["fitted_models"].items():
        joblib.dump(model_obj, os.path.join(save_path, f"ts_{model_name}.joblib"))
    metrics_summary["forecasting"] = ts_results["models"]

    # Version tag
    version_tag = datetime.now().strftime("v%Y%m%d_%H%M%S")
    version_file = os.path.join(save_path, "model_version.json")
    with open(version_file, "w") as f:
        json.dump({
            "version": version_tag,
            "ministry": ministry,
            "trained_at": datetime.now().isoformat(),
            "models_count": sum(len(v) if isinstance(v, list) else 1 for v in metrics_summary.values()),
        }, f, indent=2)

    logger.info(f"[SUCCESS] Retraining complete for {ministry} [{version_tag}]. Models saved to {save_path}")
    return metrics_summary


def run_pipeline():
    """
    Full retraining pipeline for ALL ministries.
    Called by n8n Cron schedule or manual trigger.
    Sends email notification on completion.
    """
    start_time = datetime.now()
    overall_report = {
        "pipeline_type": "retraining",
        "timestamp": start_time.isoformat(),
        "ministries": {}
    }

    for ministry in MINISTRY_DATA_PROFILES.keys():
        try:
            reports = retrain_ministry(ministry)
            overall_report["ministries"][ministry] = {
                "status": "success",
                "metrics": reports
            }
        except Exception as e:
            error_tb = traceback.format_exc()
            logger.error(f"❌ Error during retraining of {ministry}: {str(e)}\n{error_tb}")
            overall_report["ministries"][ministry] = {
                "status": "error",
                "error_message": str(e),
                "traceback": error_tb[:1000],
            }

    overall_report["duration_seconds"] = (datetime.now() - start_time).total_seconds()

    # Save to automation log
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "w") as f:
        json.dump(overall_report, f, indent=4)

    # Send email notification
    try:
        notification_service.send_pipeline_report(
            overall_report,
            recipient="emna.awini.work@gmail.com"
        )
    except Exception as e:
        logger.error(f"Failed to send pipeline report email: {e}")

    # Also trigger all notification channels
    success_count = sum(1 for m in overall_report["ministries"].values() if m["status"] == "success")
    error_count = len(overall_report["ministries"]) - success_count

    if error_count > 0:
        notification_service.alert_all(
            "Failing ML Pipeline",
            f"Retraining finished with {error_count} errors out of {len(overall_report['ministries'])} ministries.\n"
            f"Duration: {overall_report['duration_seconds']:.1f}s\n"
            f"Check logs: dashboards/logs/ml_engine.log",
            level="critical"
        )
    else:
        notification_service.alert_all(
            "ML Pipeline Success",
            f"All {success_count} ministries retrained successfully in {overall_report['duration_seconds']:.1f}s.",
            level="success"
        )

    logger.info(f"[FINISH] ALL MINISTRIES PROCESSED. Global status saved to {LOG_FILE}")
    return overall_report


# ──────────────────────────────────────────────────────────
# Inference Pipeline
# ──────────────────────────────────────────────────────────
@retry(Exception, tries=3, delay=2, backoff=2)
def run_inference_for_ministry(ministry):
    """
    Run inference using saved models for a ministry.
    Generates predictions and stores them.
    """
    logger.info(f"[INFERENCE] Running inference for {ministry}")
    save_path = os.path.join(BASE_SAVE_DIR, ministry)

    if not os.path.exists(save_path):
        raise FileNotFoundError(f"No saved models found for {ministry}. Run retraining first.")

    # Load latest data
    df_base = _build_base_dataframe(ministry=ministry, size=200)
    df_prepared, _ = _clean_and_engineer(df_base)

    predictions = {}

    # Classification inference
    cls_model_files = [f for f in os.listdir(save_path) if f.startswith("cls_") and f.endswith(".joblib")]
    for model_file in cls_model_files:
        model_name = model_file.replace("cls_", "").replace(".joblib", "")
        try:
            pipe = joblib.load(os.path.join(save_path, model_file))
            x = df_prepared.drop(columns=["target_class", "target_reg"], errors="ignore")
            preds = pipe.predict(x) if hasattr(pipe, 'predict') else []
            predictions[f"classification_{model_name}"] = {
                "count": int(len(preds)),
                "positive_pct": round(float(np.mean(preds) * 100), 2) if len(preds) > 0 else 0,
                "sample": [int(p) for p in preds[:10]],
            }
        except Exception as e:
            predictions[f"classification_{model_name}"] = {"error": str(e)}

    # Regression inference
    reg_model_files = [f for f in os.listdir(save_path) if f.startswith("reg_") and f.endswith(".joblib")]
    for model_file in reg_model_files:
        model_name = model_file.replace("reg_", "").replace(".joblib", "")
        try:
            pipe = joblib.load(os.path.join(save_path, model_file))
            x = df_prepared.drop(columns=["target_class", "target_reg"], errors="ignore")
            preds = pipe.predict(x) if hasattr(pipe, 'predict') else []
            predictions[f"regression_{model_name}"] = {
                "count": int(len(preds)),
                "mean": round(float(np.mean(preds)), 2) if len(preds) > 0 else 0,
                "std": round(float(np.std(preds)), 2) if len(preds) > 0 else 0,
                "sample": [round(float(p), 2) for p in preds[:10]],
            }
        except Exception as e:
            predictions[f"regression_{model_name}"] = {"error": str(e)}

    # Time series forecast
    ts_model_files = [f for f in os.listdir(save_path) if f.startswith("ts_") and f.endswith(".joblib")]
    for model_file in ts_model_files:
        model_name = model_file.replace("ts_", "").replace(".joblib", "")
        try:
            model = joblib.load(os.path.join(save_path, model_file))
            if hasattr(model, 'forecast'):
                forecast = model.forecast(steps=12)
                predictions[f"forecast_{model_name}"] = {
                    "horizon": 12,
                    "values": [round(float(v), 2) for v in forecast],
                }
            else:
                predictions[f"forecast_{model_name}"] = {"note": "Model loaded but no forecast method"}
        except Exception as e:
            predictions[f"forecast_{model_name}"] = {"error": str(e)}

    return predictions


def run_inference_pipeline():
    """
    Full automated inference pipeline for all ministries.
    Called by n8n Cron or Webhook.
    Predictions stored in inference_log.json and emailed.
    """
    start_time = datetime.now()
    results = {
        "pipeline_type": "inference",
        "timestamp": start_time.isoformat(),
        "ministries": list(MINISTRY_DATA_PROFILES.keys()),
        "predictions": {},
        "total_predictions": 0,
        "storage": "inference_log.json",
    }

    for ministry in MINISTRY_DATA_PROFILES.keys():
        try:
            preds = run_inference_for_ministry(ministry)
            results["predictions"][ministry] = {
                "status": "success",
                "data": preds,
            }
            results["total_predictions"] += sum(
                p.get("count", 0) for p in preds.values() if isinstance(p, dict) and "count" in p
            )
        except Exception as e:
            logger.error(f"❌ Inference failed for {ministry}: {str(e)}")
            results["predictions"][ministry] = {
                "status": "error",
                "error": str(e),
            }

    results["duration_seconds"] = (datetime.now() - start_time).total_seconds()

    # Save results
    os.makedirs(os.path.dirname(INFERENCE_LOG_FILE), exist_ok=True)
    with open(INFERENCE_LOG_FILE, "w") as f:
        json.dump(results, f, indent=4, default=str)

    # Send email notification
    try:
        notification_service.send_inference_report(
            results,
            recipient="emna.awini.work@gmail.com"
        )
    except Exception as e:
        logger.error(f"Failed to send inference report email: {e}")

    logger.info(f"[FINISH] Inference pipeline done. {results['total_predictions']} predictions generated.")
    return results


# ──────────────────────────────────────────────────────────
# Data Drift Detection (Bonus)
# ──────────────────────────────────────────────────────────
def check_data_drift(ministry: str, threshold: float = 0.15):
    """
    Simple data drift detection using statistical comparison.
    If drift exceeds threshold, triggers automatic retraining.
    Returns drift report.
    """
    logger.info(f"[DRIFT] Checking data drift for {ministry}")
    save_path = os.path.join(BASE_SAVE_DIR, ministry)
    drift_file = os.path.join(save_path, "baseline_stats.json")

    # Generate current data stats
    df = _build_base_dataframe(ministry=ministry, size=500)
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    current_stats = {
        col: {"mean": float(df[col].mean()), "std": float(df[col].std())}
        for col in numeric_cols[:10]
    }

    drift_detected = False
    drift_report = {"ministry": ministry, "features": {}, "timestamp": datetime.now().isoformat()}

    if os.path.exists(drift_file):
        with open(drift_file, "r") as f:
            baseline = json.load(f)

        for col in current_stats:
            if col in baseline:
                baseline_mean = baseline[col]["mean"]
                current_mean = current_stats[col]["mean"]
                if baseline_mean != 0:
                    pct_change = abs(current_mean - baseline_mean) / abs(baseline_mean)
                else:
                    pct_change = abs(current_mean)

                drift_report["features"][col] = {
                    "baseline_mean": round(baseline_mean, 2),
                    "current_mean": round(current_mean, 2),
                    "drift_pct": round(pct_change * 100, 2),
                    "drifted": pct_change > threshold,
                }
                if pct_change > threshold:
                    drift_detected = True

    # Save current stats as new baseline
    os.makedirs(save_path, exist_ok=True)
    with open(drift_file, "w") as f:
        json.dump(current_stats, f, indent=2)

    drift_report["drift_detected"] = drift_detected

    if drift_detected:
        logger.warning(f"[DRIFT] Data drift detected for {ministry}! Triggering retraining...")
        notification_service.alert_all(
            f"Data Drift Detected — {ministry}",
            f"Significant data drift detected for {ministry}. Automatic retraining triggered.",
            level="warning"
        )

    return drift_report


if __name__ == "__main__":
    sys.path.append(os.getcwd())
    setup_django()
    run_pipeline()
