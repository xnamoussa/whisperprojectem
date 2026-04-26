from django.urls import path

from .views import (
    MinistryDashboardView,
    MinistryMlView,
    ChatbotView,
    PredictionScenariosView,
    PredictionRunView,
    PredictionExportView,
    AutomationStatusView,
    RetrainTriggerView,
    WebhookTriggerView,
    InferenceTriggerView,
    DriftCheckView,
    NotificationLogView,
    SendTestEmailView,
)

urlpatterns = [
    path("chatbot/", ChatbotView.as_view(), name="chatbot"),

    # ── Automation & n8n Integration ──────────────────────
    path("automation/status/", AutomationStatusView.as_view(), name="automation-status"),
    path("automation/retrain/", RetrainTriggerView.as_view(), name="automation-retrain"),
    path("automation/inference/", InferenceTriggerView.as_view(), name="automation-inference"),
    path("automation/webhook/", WebhookTriggerView.as_view(), name="automation-webhook"),
    path("automation/drift/", DriftCheckView.as_view(), name="automation-drift"),
    path("automation/notifications/", NotificationLogView.as_view(), name="automation-notifications"),
    path("automation/test-email/", SendTestEmailView.as_view(), name="automation-test-email"),

    # ── Ministry-specific endpoints ───────────────────────
    path("<str:ministry>/", MinistryDashboardView.as_view(), name="ministry-dashboard"),
    path("<str:ministry>/ml/", MinistryMlView.as_view(), name="ministry-ml"),
    path("<str:ministry>/predictions/scenarios/", PredictionScenariosView.as_view(), name="prediction-scenarios"),
    path("<str:ministry>/predictions/run/", PredictionRunView.as_view(), name="prediction-run"),
    path("<str:ministry>/predictions/export/", PredictionExportView.as_view(), name="prediction-export"),
]
