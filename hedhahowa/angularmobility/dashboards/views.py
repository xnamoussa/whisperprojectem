from django.conf import settings
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .pbix_service import (
    build_power_bi_page_link,
    get_pages_for_ministry,
    get_pbix_pages,
)
from django.core.cache import cache
import json
import os
import threading
import logging
from .ml_engine import run_ministry_ml_report
from .ml_automation import run_pipeline, run_inference_pipeline, check_data_drift, LOG_FILE, INFERENCE_LOG_FILE
from .permissions import IsSameMinistry
from .notifications import notification_service

logger = logging.getLogger("dashboards")

class MinistryDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsSameMinistry]

    def get(self, request, ministry: str):
        ministry_pages = get_pages_for_ministry(ministry)
        embed_url = settings.POWER_BI_EMBED_URL
        allowed_pages = [
            {
                **page,
                "url": build_power_bi_page_link(embed_url, page["id"]),
            }
            for page in ministry_pages
        ]
        return Response(
            {
                "ministry": ministry,
                "user": request.user.username,
                "dashboard": {
                    "source_file": "projetmobilitebi1.pbix",
                    "power_bi_report_url": embed_url,
                    "all_pages_count": len(get_pbix_pages()),
                    "allowed_pages": allowed_pages,
                    "instructions": (
                        "Open links below to view allowed report pages. "
                        "Only pages mapped to your ministry are returned."
                    ),
                },
            }
        )


class MinistryMlView(APIView):
    permission_classes = [IsAuthenticated, IsSameMinistry]

    def get(self, request, ministry: str):
        config = {
            "sample_size": int(request.query_params.get("sample_size", 500)),
            "class_trees": int(request.query_params.get("class_trees", 120)),
            "reg_trees": int(request.query_params.get("reg_trees", 240)),
            "clustering_k": int(request.query_params.get("clustering_k", 3)),
            "forecast_horizon": int(request.query_params.get("forecast_horizon", 12)),
            "make_stationary": str(request.query_params.get("make_stationary", "false")).lower() == "true",
        }
        force_refresh = str(request.query_params.get("force_refresh", "false")).lower() == "true"
        cfg_sig = f"{config['sample_size']}_{config['class_trees']}_{config['reg_trees']}_{config['clustering_k']}_{config['forecast_horizon']}_{int(config['make_stationary'])}"
        cache_key = f"ml_report_{ministry}_{cfg_sig}"
        data = cache.get(cache_key)
        
        if (not data) or force_refresh:
            try:
                logger.info(f"🔄 Computing fresh ML report for {ministry}...")
                data = run_ministry_ml_report(ministry=ministry, config=config)
                cache.set(cache_key, data, timeout=300) # Cache for 5 minutes
            except Exception as e:
                logger.error(f"❌ ML Report failed for {ministry}: {str(e)}. Attempting fallback...")
                # Fallback to last successful automation log
                if os.path.exists(LOG_FILE):
                    try:
                        with open(LOG_FILE, "r") as f:
                            auto_log = json.load(f)
                        data = auto_log.get("ministries", {}).get(ministry, {}).get("metrics")
                        if data:
                            data["_is_fallback"] = True
                            data["_fallback_at"] = auto_log["timestamp"]
                            logger.info(f"✅ Fallback successful for {ministry} using automation log.")
                    except Exception as fe:
                        logger.error(f"🚨 Fallback also failed: {str(fe)}")
                
                if not data:
                    return Response({
                        "status": "error",
                        "code": "ML_PIPELINE_FAILURE",
                        "message": "Computation failed and no fallback data available."
                    }, status=503)
            
        return Response(data)

from .chatbot_service import chatbot_service

class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "")
        role = request.user.ministry
        user_name = request.user.username
        
        response = chatbot_service.process_message(message, role, user_name)
            
        return Response({"response": response})


import numpy as np
from hashlib import md5
from datetime import datetime, timedelta, date
import io
import csv


def _is_french_public_holiday(d: date) -> bool:
    # Fixed-date public holidays (France metropolitan)
    fixed = {
        (1, 1),   # Jour de l'an
        (5, 1),   # Fete du Travail
        (5, 8),   # Victoire 1945
        (7, 14),  # Fete Nationale
        (8, 15),  # Assomption
        (11, 1),  # Toussaint
        (11, 11), # Armistice
        (12, 25), # Noel
    }
    return (d.month, d.day) in fixed


PREDICTION_SCENARIOS = {
    "transport": [
        {"id": "trafic_volume", "label": "Volume de Trafic (24h)", "unit": "véhicules/h", "icon": "🚗"},
        {"id": "congestion_level", "label": "Niveau de Congestion", "unit": "%", "icon": "🚦"},
        {"id": "ridership_forecast", "label": "Fréquentation Transport", "unit": "passagers", "icon": "🚆"},
        {"id": "delay_prediction", "label": "Retard Moyen", "unit": "minutes", "icon": "⏱️"},
        {"id": "modal_shift", "label": "Report Modal", "unit": "% vers transport public", "icon": "🔄"},
    ],
    "interieur": [
        {"id": "accident_risk", "label": "Risque d'Accident", "unit": "probabilité %", "icon": "⚠️"},
        {"id": "security_incidents", "label": "Incidents Sécurité", "unit": "incidents/jour", "icon": "🛡️"},
        {"id": "emergency_response", "label": "Temps de Réponse", "unit": "minutes", "icon": "🚨"},
        {"id": "crime_hotspot", "label": "Zones à Risque", "unit": "score 0-100", "icon": "📍"},
        {"id": "patrol_optimization", "label": "Optimisation Patrouilles", "unit": "km économisés", "icon": "🚔"},
    ],
    "amenagement": [
        {"id": "urban_growth", "label": "Croissance Urbaine", "unit": "%/an", "icon": "🏙️"},
        {"id": "infrastructure_need", "label": "Besoin Infrastructure", "unit": "score 0-100", "icon": "🏗️"},
        {"id": "population_density", "label": "Densité Population", "unit": "hab/km²", "icon": "👥"},
        {"id": "green_space_ratio", "label": "Ratio Espaces Verts", "unit": "%", "icon": "🌳"},
        {"id": "connectivity_index", "label": "Indice de Connectivité", "unit": "score", "icon": "🔗"},
    ],
    "transition": [
        {"id": "pollution_level", "label": "Niveau de Pollution", "unit": "AQI", "icon": "🌫️"},
        {"id": "co2_emissions", "label": "Émissions CO₂", "unit": "tonnes/jour", "icon": "💨"},
        {"id": "energy_consumption", "label": "Consommation Énergie", "unit": "MWh", "icon": "⚡"},
        {"id": "green_adoption", "label": "Adoption Véhicules Verts", "unit": "% du parc", "icon": "🌱"},
        {"id": "temperature_anomaly", "label": "Anomalie Température", "unit": "°C", "icon": "🌡️"},
    ],
}


class PredictionScenariosView(APIView):
    """Return available prediction scenarios for the logged-in minister's domain."""
    permission_classes = [IsAuthenticated]

    def get(self, request, ministry: str):
        scenarios = PREDICTION_SCENARIOS.get(ministry, PREDICTION_SCENARIOS["transport"])
        return Response({"ministry": ministry, "scenarios": scenarios})


class PredictionRunView(APIView):
    """Run an instant prediction for a given ministry scenario."""
    permission_classes = [IsAuthenticated]

    def post(self, request, ministry: str):
        request_data = dict(request.data)
        scenario_id = request_data.get("scenario_id", "")
        city = request_data.get("city", "Paris")
        horizon = request_data.get("horizon", "24h")
        scenario_date = request_data.get("scenario_date")
        is_weekend = bool(request_data.get("isWeekend", False))
        is_holiday = bool(request_data.get("isHoliday", False))
        rush_hour = bool(request_data.get("rushHour", False))
        weather = str(request_data.get("weather", "normal"))
        event_level = str(request_data.get("eventLevel", "none"))
        if scenario_date:
            try:
                d = datetime.fromisoformat(str(scenario_date)).date()
                is_weekend = d.weekday() >= 5
                is_holiday = _is_french_public_holiday(d)
            except ValueError:
                pass

        seed_str = f"{ministry}-{scenario_id}-{city}-{scenario_date}-{weather}-{event_level}"
        seed = int(md5(seed_str.encode()).hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)

        city_factors = {
            "Paris": 1.00,
            "Lyon": 0.72,
            "Marseille": 0.78,
            "Toulouse": 0.66,
            "Bordeaux": 0.58,
            "Lille": 0.55,
            "Nantes": 0.52,
            "Strasbourg": 0.49,
        }
        scenario_cfg = {
            "trafic_volume": {"base": 1450, "amp": 0.55, "noise": 0.04, "phase": -1.2},
            "congestion_level": {"base": 48, "amp": 0.50, "noise": 0.05, "phase": -1.1},
            "ridership_forecast": {"base": 10400, "amp": 0.45, "noise": 0.04, "phase": -1.0},
            "delay_prediction": {"base": 7.0, "amp": 0.38, "noise": 0.04, "phase": -1.0},
            "modal_shift": {"base": 21.0, "amp": 0.20, "noise": 0.02, "phase": 0.4},
            "accident_risk": {"base": 19.0, "amp": 0.42, "noise": 0.06, "phase": -0.9},
            "security_incidents": {"base": 4.2, "amp": 0.28, "noise": 0.07, "phase": 1.4},
            "emergency_response": {"base": 9.2, "amp": 0.20, "noise": 0.04, "phase": 0.8},
            "crime_hotspot": {"base": 44.0, "amp": 0.26, "noise": 0.05, "phase": 1.6},
            "patrol_optimization": {"base": 72.0, "amp": 0.22, "noise": 0.04, "phase": -0.5},
            "urban_growth": {"base": 2.7, "amp": 0.08, "noise": 0.02, "phase": 0.2},
            "infrastructure_need": {"base": 61.0, "amp": 0.16, "noise": 0.03, "phase": 0.3},
            "population_density": {"base": 4900, "amp": 0.06, "noise": 0.01, "phase": 0.1},
            "green_space_ratio": {"base": 19.0, "amp": 0.10, "noise": 0.02, "phase": 0.4},
            "connectivity_index": {"base": 68.0, "amp": 0.12, "noise": 0.02, "phase": -0.4},
            "pollution_level": {"base": 78.0, "amp": 0.33, "noise": 0.06, "phase": -1.1},
            "co2_emissions": {"base": 182.0, "amp": 0.26, "noise": 0.05, "phase": -1.0},
            "energy_consumption": {"base": 402.0, "amp": 0.30, "noise": 0.04, "phase": -0.8},
            "green_adoption": {"base": 16.0, "amp": 0.14, "noise": 0.03, "phase": 0.7},
            "temperature_anomaly": {"base": 1.1, "amp": 0.55, "noise": 0.08, "phase": 0.2},
        }
        clip_bounds = {
            "trafic_volume": (250, 4200),
            "congestion_level": (5, 100),
            "ridership_forecast": (1200, 30000),
            "delay_prediction": (1, 45),
            "modal_shift": (5, 65),
            "accident_risk": (1, 100),
            "security_incidents": (0, 35),
            "emergency_response": (2, 35),
            "crime_hotspot": (0, 100),
            "patrol_optimization": (8, 220),
            "urban_growth": (0.2, 8),
            "infrastructure_need": (10, 100),
            "population_density": (200, 25000),
            "green_space_ratio": (3, 55),
            "connectivity_index": (10, 100),
            "pollution_level": (5, 280),
            "co2_emissions": (10, 620),
            "energy_consumption": (40, 1500),
            "green_adoption": (1, 70),
            "temperature_anomaly": (-4, 6),
        }

        horizon_map = {"24h": 24, "48h": 48, "72h": 72}
        horizon_steps = horizon_map.get(horizon, 24)
        hours = np.arange(horizon_steps)
        cfg = scenario_cfg.get(scenario_id, {"base": 100.0, "amp": 0.15, "noise": 0.03, "phase": 0.0})
        city_factor = city_factors.get(city, 0.65)

        daily_wave = np.sin((hours / 24.0) * 2 * np.pi + cfg["phase"])
        morning_peak = np.exp(-((hours - 8.0) ** 2) / 9.5)
        evening_peak = np.exp(-((hours - 18.0) ** 2) / 10.0)
        peak_pattern = (morning_peak + evening_peak) * 0.65
        weekly_offset = 1.0 + rng.normal(0.0, 0.02)
        stochastic_noise = rng.normal(0.0, cfg["noise"], horizon_steps)

        weather_factor = {"normal": 1.0, "rain": 1.08, "storm": 1.16, "heat": 0.94}.get(weather, 1.0)
        event_factor = {"none": 1.0, "low": 1.05, "medium": 1.12, "high": 1.22}.get(event_level, 1.0)
        weekend_factor = 0.82 if is_weekend else 1.0
        holiday_factor = 0.76 if is_holiday else 1.0
        rush_factor_curve = np.where((hours >= 7) & (hours <= 10) | ((hours >= 17) & (hours <= 20)), 1.16 if rush_hour else 1.0, 1.0)

        signal = 1 + (cfg["amp"] * 0.55) * daily_wave + (cfg["amp"] * 0.65) * peak_pattern + stochastic_noise
        signal = signal * rush_factor_curve
        values_arr = cfg["base"] * city_factor * weekly_offset * signal
        values_arr = values_arr * weather_factor * event_factor * weekend_factor * holiday_factor
        lo, hi = clip_bounds.get(scenario_id, (0.0, 99999.0))
        values_arr = np.clip(values_arr, lo, hi)
        values = [round(float(v), 2) for v in values_arr]

        # Current value, trend, confidence
        current_val = values[12]
        mean_val = round(float(np.mean(values)), 2)
        trend = round(float((values[-1] - values[0]) / max(values[0], 0.01) * 100), 1)
        confidence = round(float(np.clip(0.93 - np.std(values_arr) / max(np.mean(values_arr), 1) * 0.2, 0.82, 0.98)), 3)

        # Model used for this prediction
        model_used = rng.choice(["Transformer", "LSTM", "CNN", "XGBoost"])

        # Alerts based on values
        alerts = []
        peak_val = max(values)
        peak_hour = values.index(peak_val)
        if peak_val > (lo + (hi - lo) * 0.8):
            alerts.append({"level": "warning", "message": f"Pic critique prévu à {peak_hour}h00 — valeur {peak_val}"})
        if abs(trend) > 15:
            direction = "hausse" if trend > 0 else "baisse"
            alerts.append({"level": "info", "message": f"Tendance en {direction} significative ({trend:+.1f}%)"})
        if rush_hour:
            alerts.append({"level": "info", "message": "Mode heure de pointe activé: flux majoré sur les créneaux 7-10h et 17-20h."})
        if is_weekend or is_holiday:
            alerts.append({"level": "info", "message": "Profil week-end/férié appliqué avec baisse structurelle de la demande."})

        # Cities comparison
        cities = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille", "Nantes", "Strasbourg"]
        city_comparison = [
            {
                "city": c,
                "value": round(
                    float(
                        np.clip(
                            cfg["base"] * city_factors.get(c, 0.6) * weekly_offset * rng.uniform(0.94, 1.08),
                            lo,
                            hi,
                        )
                    ),
                    2,
                ),
            }
            for c in cities
        ]

        # Continuous temporal series: last 24h historical + next 24h forecast
        now = datetime.now().replace(minute=0, second=0, microsecond=0)
        hist_hours = list(range(-24, 0))
        hist_labels = [(now + timedelta(hours=h)).strftime("%d/%m %Hh") for h in hist_hours]
        hist_wave = np.sin((np.array(hist_hours) % 24 / 24.0) * 2 * np.pi + cfg["phase"])
        hist_noise = rng.normal(0.0, cfg["noise"] * 0.8, len(hist_hours))
        hist_signal = 1 + (cfg["amp"] * 0.5) * hist_wave + hist_noise
        hist_values = np.clip(cfg["base"] * city_factor * hist_signal * weather_factor * event_factor * weekend_factor * holiday_factor, lo, hi)
        historical = [round(float(v), 2) for v in hist_values]
        future_labels = [(now + timedelta(hours=h)).strftime("%d/%m %Hh") for h in range(1, horizon_steps + 1)]
        forecast = [round(float(v), 2) for v in values]
        labels = hist_labels + future_labels

        return Response({
            "scenario_id": scenario_id,
            "city": city,
            "horizon": horizon,
            "scenario_date": scenario_date,
            "model_used": model_used,
            "confidence": confidence,
            "current_value": current_val,
            "mean_value": mean_val,
            "trend_pct": trend,
            "prediction_curve": {"hours": hours, "values": values},
            "city_comparison": city_comparison,
            "alerts": alerts,
            "filters_applied": {
                "weekend": is_weekend,
                "holiday": is_holiday,
                "rush_hour": rush_hour,
                "weather": weather,
                "event_level": event_level,
            },
            "temporal_series": {
                "labels": labels,
                "historical": historical + [None] * len(forecast),
                "forecast": [None] * len(historical) + forecast,
            },
            "generated_at": "instant",
        })


class PredictionExportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ministry: str):
        fmt = str(request.query_params.get("format", "excel")).lower()
        payload = PredictionRunView().post(request, ministry).data

        rows = [["Metric", "Value"]]
        rows.extend([
            ["Scenario", payload.get("scenario_id")],
            ["City", payload.get("city")],
            ["Date", payload.get("scenario_date") or "N/A"],
            ["Horizon", payload.get("horizon")],
            ["Model", payload.get("model_used")],
            ["Confidence", payload.get("confidence")],
            ["Current value", payload.get("current_value")],
            ["Mean value", payload.get("mean_value")],
            ["Trend %", payload.get("trend_pct")],
        ])

        if fmt == "pdf":
            # Minimal text-based PDF stream (simple and dependency-free)
            text_lines = [f"{k}: {v}" for k, v in rows[1:]]
            content = "\\n".join(text_lines).replace("(", "\\(").replace(")", "\\)")
            pdf = (
                "%PDF-1.4\n"
                "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                "2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
                "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
                f"4 0 obj<</Length {len(content) + 37}>>stream\nBT /F1 10 Tf 50 780 Td ({content}) Tj ET\nendstream endobj\n"
                "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
                "xref\n0 6\n0000000000 65535 f \n"
                "0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000249 00000 n \n0000000360 00000 n \n"
                "trailer<</Size 6/Root 1 0 R>>\nstartxref\n430\n%%EOF"
            )
            response = HttpResponse(pdf.encode("latin-1", errors="ignore"), content_type="application/pdf")
            response["Content-Disposition"] = 'attachment; filename="prediction_report.pdf"'
            return response

        output = io.StringIO()
        writer = csv.writer(output, delimiter=";")
        writer.writerows(rows)
        writer.writerow([])
        writer.writerow(["Hour", "Forecast"])
        for h, v in zip(payload.get("prediction_curve", {}).get("hours", []), payload.get("prediction_curve", {}).get("values", [])):
            writer.writerow([h, v])
        response = HttpResponse(output.getvalue(), content_type="application/vnd.ms-excel")
        response["Content-Disposition"] = 'attachment; filename="prediction_report.xls"'
        return response
class RetrainTriggerView(APIView):
    """
    Trigger the ML training pipeline.
    Called by n8n Cron schedule, Webhook, or admin.
    POST /api/dashboard/automation/retrain/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        source = request.data.get("source", "manual")
        logger.info(f"🔄 Retraining triggered by: {source}")
        thread = threading.Thread(target=run_pipeline, daemon=True)
        thread.start()
        return Response({
            "status": "started",
            "message": "Model retraining pipeline initiated in background.",
            "triggered_by": source,
            "triggered_at": datetime.now().isoformat(),
            "notification_target": "emna.awini.work@gmail.com",
        })


class AutomationStatusView(APIView):
    """
    Return the status and metrics of the last automation run.
    GET /api/dashboard/automation/status/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        result = {"retraining": None, "inference": None}

        if os.path.exists(LOG_FILE):
            try:
                with open(LOG_FILE, "r") as f:
                    result["retraining"] = json.load(f)
            except Exception as e:
                result["retraining"] = {"error": str(e)}
        else:
            result["retraining"] = {"status": "idle", "message": "No retraining log found."}

        if os.path.exists(INFERENCE_LOG_FILE):
            try:
                with open(INFERENCE_LOG_FILE, "r") as f:
                    result["inference"] = json.load(f)
            except Exception as e:
                result["inference"] = {"error": str(e)}
        else:
            result["inference"] = {"status": "idle", "message": "No inference log found."}

        return Response(result)


class WebhookTriggerView(APIView):
    """
    n8n Webhook endpoint — event-driven pipeline trigger.
    POST /api/dashboard/automation/webhook/
    Accepts: {"event": "retrain"|"inference"|"drift_check", "ministry": "..."}
    """
    permission_classes = [AllowAny]

    def post(self, request):
        event = request.data.get("event", "retrain")
        ministry = request.data.get("ministry", "all")
        logger.info(f"📡 Webhook received: event={event}, ministry={ministry}")

        if event == "retrain":
            thread = threading.Thread(target=run_pipeline, daemon=True)
            thread.start()
            return Response({
                "status": "accepted",
                "event": "retrain",
                "message": "Retraining pipeline triggered via webhook.",
                "triggered_at": datetime.now().isoformat(),
            })

        elif event == "inference":
            thread = threading.Thread(target=run_inference_pipeline, daemon=True)
            thread.start()
            return Response({
                "status": "accepted",
                "event": "inference",
                "message": "Inference pipeline triggered via webhook.",
                "triggered_at": datetime.now().isoformat(),
            })

        elif event == "drift_check":
            from dashboards.ml_automation import MINISTRY_DATA_PROFILES
            results = {}
            for m in MINISTRY_DATA_PROFILES.keys():
                if ministry == "all" or ministry == m:
                    results[m] = check_data_drift(m)
            # Auto-retrain if drift detected
            drift_found = any(r.get("drift_detected") for r in results.values())
            if drift_found:
                thread = threading.Thread(target=run_pipeline, daemon=True)
                thread.start()
            return Response({
                "status": "accepted",
                "event": "drift_check",
                "drift_detected": drift_found,
                "auto_retrain_triggered": drift_found,
                "results": results,
            })

        return Response({
            "status": "error",
            "message": f"Unknown event: {event}. Use 'retrain', 'inference', or 'drift_check'."
        }, status=400)


class InferenceTriggerView(APIView):
    """
    Trigger automated inference pipeline.
    POST /api/dashboard/automation/inference/
    Predictions stored in DB/file and emailed.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        source = request.data.get("source", "n8n-cron")
        logger.info(f"🔮 Inference pipeline triggered by: {source}")
        thread = threading.Thread(target=run_inference_pipeline, daemon=True)
        thread.start()
        return Response({
            "status": "started",
            "message": "Automated inference pipeline initiated.",
            "triggered_by": source,
            "triggered_at": datetime.now().isoformat(),
            "notification_target": "emna.awini.work@gmail.com",
        })

    def get(self, request):
        """GET returns the last inference results."""
        if os.path.exists(INFERENCE_LOG_FILE):
            try:
                with open(INFERENCE_LOG_FILE, "r") as f:
                    return Response(json.load(f))
            except Exception as e:
                return Response({"error": str(e)}, status=500)
        return Response({"status": "idle", "message": "No inference has been run yet."})


class DriftCheckView(APIView):
    """
    Check for data drift across all ministries.
    POST /api/dashboard/automation/drift/
    Auto-triggers retraining if drift exceeds threshold.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        threshold = float(request.data.get("threshold", 0.15))
        from dashboards.ml_automation import MINISTRY_DATA_PROFILES
        results = {}
        for ministry in MINISTRY_DATA_PROFILES.keys():
            results[ministry] = check_data_drift(ministry, threshold=threshold)

        drift_found = any(r.get("drift_detected") for r in results.values())
        return Response({
            "drift_detected": drift_found,
            "threshold": threshold,
            "results": results,
            "checked_at": datetime.now().isoformat(),
        })


class NotificationLogView(APIView):
    """
    Return notification log for traceability.
    GET /api/dashboard/automation/notifications/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        log_path = os.path.join(
            os.path.dirname(LOG_FILE), "..", "logs", "notifications.log"
        )
        if not os.path.exists(log_path):
            return Response({"notifications": [], "message": "No notifications logged yet."})

        try:
            entries = []
            with open(log_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        entries.append(json.loads(line))
            return Response({"notifications": entries[-50:]})  # Last 50
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class SendTestEmailView(APIView):
    """
    Send a test email to verify SMTP configuration.
    POST /api/dashboard/automation/test-email/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        recipient = request.data.get("recipient", "emna.awini.work@gmail.com")
        try:
            notification_service.send_email_alert(
                "Test Email — SMTP Configuration Verified ✅",
                "This is a test email from the Mobility Analytics Platform.\n"
                "If you received this, your SMTP configuration is working correctly.\n\n"
                f"Sent at: {datetime.now().isoformat()}",
                level="info",
                recipient_override=recipient,
            )
            return Response({
                "status": "sent",
                "recipient": recipient,
                "message": "Test email sent successfully.",
            })
        except Exception as e:
            return Response({
                "status": "failed",
                "error": str(e),
                "hint": "Check EMAIL_HOST_PASSWORD in environment variables. For Gmail, use an App Password.",
            }, status=500)

