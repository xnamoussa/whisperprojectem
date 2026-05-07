import argparse
import random
import time
import os
import socket

import requests
import mlflow

API_BASE = "http://localhost:8000"

def _setup_mlflow():
    """Setup MLflow tracking URI and experiment."""
    # Resolve 'mlflow' if running inside docker, otherwise use localhost
    tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    if "http://mlflow:" in tracking_uri:
        try:
            ip = socket.gethostbyname("mlflow")
            tracking_uri = tracking_uri.replace("mlflow", ip)
        except Exception:
            pass
    
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment("Monitoring_Simulations")
    return tracking_uri

def _normal_payload():
    return {
        "city": "Paris",
        "station_type": "Metro",
        "lat": 48.8,
        "lon": 2.3,
        "connections": 5,
        "daily_traffic": 45000,
        "no2": 36.0,
    }


def simulate_high_traffic(requests_count: int = 200):
    _setup_mlflow()
    with mlflow.start_run(run_name=f"High_Traffic_{int(time.time())}"):
        mlflow.set_tag("scenario", "high_traffic")
        mlflow.log_param("requested_count", requests_count)
        
        requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 1, "error": 0, "drift": 0}, timeout=5)
        ok = 0
        failed = 0
        for i in range(requests_count):
            payload = _normal_payload()
            payload["daily_traffic"] += random.randint(-5000, 5000)
            payload["no2"] += random.uniform(-4, 4)
            try:
                r = requests.post(f"{API_BASE}/predict", json=payload, timeout=10)
                if r.status_code == 200:
                    ok += 1
                else:
                    failed += 1
            except requests.RequestException:
                failed += 1
            time.sleep(0.05)
            if i % 25 == 0:
                print(f"[high_traffic] sent={i} ok={ok} failed={failed}")
        
        mlflow.log_metrics({"ok_count": ok, "failed_count": failed, "success_rate": ok/requests_count if requests_count > 0 else 0})
        print(f"[high_traffic] done ok={ok} failed={failed}")
        requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 0, "drift": 0}, timeout=5)


def simulate_api_errors(requests_count: int = 60):
    _setup_mlflow()
    with mlflow.start_run(run_name=f"API_Errors_{int(time.time())}"):
        mlflow.set_tag("scenario", "api_errors")
        mlflow.log_param("requested_count", requests_count)
        
        requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 1, "drift": 0}, timeout=5)
        errors = 0
        for i in range(requests_count):
            bad_payload = {"city": "Paris", "daily_traffic": "not-a-number"}
            try:
                r = requests.post(f"{API_BASE}/predict", json=bad_payload, timeout=10)
                if r.status_code != 200:
                    errors += 1
                print(f"[api_errors] request={i} status={r.status_code}")
            except:
                errors += 1
            time.sleep(0.05)
        
        mlflow.log_metric("error_count", errors)
        print("[api_errors] done")
        requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 0, "drift": 0}, timeout=5)


def simulate_model_drift(requests_count: int = 120):
    _setup_mlflow()
    with mlflow.start_run(run_name=f"Model_Drift_{int(time.time())}"):
        mlflow.set_tag("scenario", "model_drift")
        mlflow.log_param("requested_count", requests_count)
        
        # Simulate accuracy drop during drift
        requests.post(f"{API_BASE}/monitoring/baseline", json={"accuracy_current": 0.78}, timeout=5)
        
        requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 0, "drift": 1}, timeout=5)
        drifts = 0
        for i in range(requests_count):
            payload = _normal_payload()
            payload["daily_traffic"] = random.uniform(120000, 240000)
            payload["no2"] = random.uniform(90, 200)
            payload["connections"] = random.randint(18, 50)
            try:
                r = requests.post(f"{API_BASE}/predict", json=payload, timeout=10)
                if r.status_code == 200 and r.json().get("drift_detected"):
                    drifts += 1
                time.sleep(0.05)
                if i % 20 == 0:
                    print(f"[model_drift] request={i} status={r.status_code}")
            except:
                pass
        
        mlflow.log_metric("drift_detected_count", drifts)
        print("[model_drift] done")
        requests.post(f"{API_BASE}/monitoring/baseline", json={"accuracy_current": 0.90}, timeout=5)
        requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 0, "drift": 0}, timeout=5)


def main():
    parser = argparse.ArgumentParser(description="Simulate S13 monitoring incidents.")
    parser.add_argument(
        "--scenario",
        required=True,
        choices=["high_traffic", "api_errors", "model_drift"],
        help="Scenario to run",
    )
    parser.add_argument("--count", type=int, default=100, help="Number of requests")
    args = parser.parse_args()

    if args.scenario == "high_traffic":
        simulate_high_traffic(args.count)
    elif args.scenario == "api_errors":
        simulate_api_errors(args.count)
    elif args.scenario == "model_drift":
        simulate_model_drift(args.count)


if __name__ == "__main__":
    main()

