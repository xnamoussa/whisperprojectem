import argparse
import random
import time

import requests


API_BASE = "http://localhost:8001"


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
        time.sleep(0.05)  # spread over time so Grafana shows a visible spike
        if i % 25 == 0:
            print(f"[high_traffic] sent={i} ok={ok} failed={failed}")
    print(f"[high_traffic] done ok={ok} failed={failed}")
    requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 0, "drift": 0}, timeout=5)


def simulate_api_errors(requests_count: int = 60):
    requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 1, "drift": 0}, timeout=5)
    for i in range(requests_count):
        bad_payload = {"city": "Paris", "daily_traffic": "not-a-number"}
        r = requests.post(f"{API_BASE}/predict", json=bad_payload, timeout=10)
        print(f"[api_errors] request={i} status={r.status_code}")
        time.sleep(0.05)
    print("[api_errors] done")
    requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 0, "drift": 0}, timeout=5)


def simulate_model_drift(requests_count: int = 120):
    requests.post(f"{API_BASE}/monitoring/simulation-mode", json={"traffic": 0, "error": 0, "drift": 1}, timeout=5)
    for i in range(requests_count):
        payload = _normal_payload()
        payload["daily_traffic"] = random.uniform(120000, 240000)
        payload["no2"] = random.uniform(90, 200)
        payload["connections"] = random.randint(18, 50)
        r = requests.post(f"{API_BASE}/predict", json=payload, timeout=10)
        time.sleep(0.05)
        if i % 20 == 0:
            print(f"[model_drift] request={i} status={r.status_code}")
    print("[model_drift] done")
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
