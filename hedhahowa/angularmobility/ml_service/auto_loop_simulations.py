import subprocess
import time
import random
import sys

SCENARIOS = ["high_traffic", "api_errors", "model_drift"]

def get_random_count(scenario):
    if scenario == "high_traffic":
        return random.randint(100, 600)  # High traffic spikes
    elif scenario == "api_errors":
        return random.randint(30, 200)   # Error bursts
    else:
        return random.randint(50, 150)   # Drift samples

def run_simulation(scenario, count):
    print(f"\n🚀 [AUTO] Starting Scenario: {scenario} with {count} requests...")
    try:
        # We run it using the same logic as your manual commands
        subprocess.run([
            "python", "simulate_incidents.py", 
            "--scenario", scenario, 
            "--count", str(count)
        ], check=True)
        print(f"✅ [AUTO] {scenario} completed successfully.")
    except Exception as e:
        print(f"❌ [AUTO] Error running {scenario}: {e}")

def main():
    print("═══ 🤖 CONTINUOUS MLOPS SIMULATOR STARTING ═══")
    print("Press Ctrl+C to stop.")
    
    while True:
        # Pick a random scenario
        scenario = random.choice(SCENARIOS)
        # Pick a random count based on the scenario
        count = get_random_count(scenario)
        
        run_simulation(scenario, count)
        
        print(f"😴 Waiting 30 seconds before next scenario...")
        time.sleep(30)

if __name__ == "__main__":
    main()
