import os
import django
import pandas as pd

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from dashboards.ml_engine import run_ministry_ml_report

def test_ml():
    print("Testing ML Engine with Real Data...")
    ministries = ["transport", "transition", "interieur", "amenagement"]
    for m in ministries:
        print(f"\n--- Report for {m} ---")
        report = run_ministry_ml_report(m)
        print(f"Classification best model: {report['classification']['best_model']}")
        print(f"Regression metrics for Ridge: {report['regression']['models'][0]['metrics']}")
        print(f"Clustering K-Means Silhouette: {report['clustering']['models'][0]['silhouette']}")
        print(f"Forecasting MAPE for SARIMA: {report['forecasting']['models'][1]['metrics']['mape']}%")
        print(f"Data Cleaning Outliers Before: {report['data_preparation']['outliers_before']}")

if __name__ == "__main__":
    test_ml()
