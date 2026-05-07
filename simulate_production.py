import requests
import time
import random
import threading

BASE_URL = "http://localhost:8000"

def simulate_traffic(ministry, scenario):
    """Simulate regular prediction requests."""
    print(f"🚀 Starting traffic simulation for {ministry}...")
    while True:
        try:
            resp = requests.post(
                f"{BASE_URL}/api/dashboard/{ministry}/predictions/run/",
                json={"scenario_id": scenario, "city": "Paris"}
            )
            print(f"[{ministry}] Request: {resp.status_code}")
        except Exception as e:
            print(f"Error in traffic sim: {e}")
        time.sleep(random.uniform(1, 5))

def simulate_errors():
    """Simulate API errors."""
    print("❌ Starting error simulation...")
    while True:
        try:
            # Request non-existent endpoint
            requests.get(f"{BASE_URL}/api/dashboard/invalid-endpoint/")
        except:
            pass
        time.sleep(random.uniform(10, 30))

def trigger_drift_and_retrain():
    """Trigger drift check and inference pipeline via webhooks."""
    print("🔍 Triggering drift check and inference...")
    while True:
        try:
            # Trigger drift check
            requests.post(f"{BASE_URL}/api/dashboard/automation/drift/", json={"threshold": 0.05})
            # Trigger inference
            requests.post(f"{BASE_URL}/api/dashboard/automation/inference/")
        except Exception as e:
            print(f"Error in automation trigger: {e}")
        time.sleep(60) # Every minute

if __name__ == "__main__":
    print("=== MLOps Monitoring Simulation Started ===")
    print("Note: Ensure the Django server is running on port 8000.")
    
    # In a real scenario, we'd need a valid JWT token.
    # For simulation purposes, we assume the server might have some open endpoints or we use a static token.
    
    t1 = threading.Thread(target=simulate_errors, daemon=True)
    t2 = threading.Thread(target=trigger_drift_and_retrain, daemon=True)
    
    t1.start()
    t2.start()
    
    # Simulate some traffic to various ministries
    ministries = ["transport", "transition", "interieur", "amenagement"]
    for m in ministries:
        threading.Thread(target=simulate_traffic, args=(m, "trafic_volume"), daemon=True).start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Simulation stopped.")
