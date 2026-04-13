from django.urls import path

from .views import (
    MinistryDashboardView,
    MinistryMlView,
    ChatbotView,
    PredictionScenariosView,
    PredictionRunView,
)

urlpatterns = [
    path("chatbot/", ChatbotView.as_view(), name="chatbot"),
    path("<str:ministry>/", MinistryDashboardView.as_view(), name="ministry-dashboard"),
    path("<str:ministry>/ml/", MinistryMlView.as_view(), name="ministry-ml"),
    path("<str:ministry>/predictions/scenarios/", PredictionScenariosView.as_view(), name="prediction-scenarios"),
    path("<str:ministry>/predictions/run/", PredictionRunView.as_view(), name="prediction-run"),
]
