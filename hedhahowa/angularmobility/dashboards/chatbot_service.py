import random
import json
from django.conf import settings
import requests

class UrbainChatbotService:
    @staticmethod
    def process_message(message: str, ministry: str, user_name: str) -> str:
        msg = message.lower()
        api_key = getattr(settings, "CHATBOT_API_KEY", None)
        
        # Real Gemini API Integration
        if api_key and api_key != "YOUR_REAL_API_KEY_HERE":
            try:
                # Gemini Pro API endpoint
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
                headers = {'Content-Type': 'application/json'}
                prompt = f"Tu es l'assistant IA virox du Ministère {ministry} en France. Réponds à la question suivante de manière courte et experte: {message}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}]
                }
                response = requests.post(url, headers=headers, json=payload, timeout=10)
                if response.status_code == 200:
                    return response.json()['candidates'][0]['content']['parts'][0]['text']
            except Exception as e:
                print(f"Chatbot API Error: {e}")
                # Fallback to local simulation if API fails
        
        # Mapping specific to each ministry's expertise
        context_prompts = {
            "transport": "En tant qu'expert en gestion de trafic,",
            "environnement": "Spécialisé dans l'analyse de l'impact écologique,",
            "interieur": "Expert en surveillance et sécurité urbaine,",
            "amenagement": "Conseiller en planification territoriale,"
        }
        
        prefix = context_prompts.get(ministry.lower(), "Assistant virox,")
        
        # Knowledge base per topic (France context)
        responses = {
            "trafic": [
                f"{prefix} je prévois une saturation sur l'A1 vers Lille demain matin. Je suggère d'activer les voies réservées.",
                f"{prefix} l'analyse des flux à Nantes montre une efficacité accrue du tramway (+4.2%) après les derniers travaux.",
                f"{prefix} à Lyon, la saturation du tunnel de Fourvière pourrait être réduite de 20% par un report modal vers le RER."
            ],
            "pollution": [
                f"{prefix} l'indice de qualité de l'air à Paris risque de dépasser le seuil d'alerte. Une circulation différenciée est recommandée.",
                f"{prefix} les capteurs PM10 à Marseille indiquent une corrélation directe avec les vents d'est. Surveillance accrue conseillée.",
                f"{prefix} à Bordeaux, la pollution est en baisse de 15% grâce à l'extension des zones piétonnes."
            ],
            "securite": [
                f"{prefix} j'ai détecté des anomalies dans les flux de passagers à la Gare de l'Est. Surveillance recommandée.",
                f"{prefix} les zones à haut risque d'accidents à Toulouse ont été réduites de 10% suite au déploiement des caméras IA.",
                f"{prefix} à Nice, l'IA suggère d'optimiser le timing des feux pour faciliter le passage des véhicules de secours."
            ],
            "ml": [
                f"{prefix} nous utilisons un modèle SARIMAX pour vos prévisions météo-dépendantes avec une précision de 92%.",
                f"{prefix} l'algorithme de détection d'anomalies a identifié 3 comportements suspects sur le réseau ce matin.",
                f"{prefix} la segmentation clustering montre que 32% de vos administrés privilégient désormais les mobilités douces."
            ]
        }

        # Contextual response selection
        if any(word in msg for word in ["bonjour", "salut", "hello"]):
            return f"Bonjour Monsieur le Ministre {user_name}. Je suis l'assistant virox spécialisé pour le département {ministry}. Comment puis-je vous éclairer sur les données de mobilité aujourd'hui ?"
        
        for key, possible_responses in responses.items():
            if key in msg:
                return random.choice(possible_responses)
        
        if "aide" in msg or "quoi" in msg:
            return "Je peux vous renseigner sur le trafic, la pollution, la sécurité urbaine, nos modèles prédictifs ML ou le budget de votre ministère."

        return f"Je reste à votre disposition pour toute analyse sur le ministère {ministry}. Pouvez-vous préciser votre question sur le trafic ou la pollution ?"

chatbot_service = UrbainChatbotService()
