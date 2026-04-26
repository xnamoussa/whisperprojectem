"""Quick script to test login + diagnose the 500 error."""
import os, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django
django.setup()

from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# 1. Check password hashes
for uname, pwd in [
    ("emna.awini@esprit.tn", "emma123"),
    ("Ayed.rayen@esprit.tn", "Realmadridftw123."),
    ("amenagement@sasa.gov.ma", "urbain2026"),
    ("transition@sasa.gov.ma", "urbain2026"),
    ("admin", "admin2026"),
]:
    try:
        u = User.objects.get(username=uname)
        ok = u.check_password(pwd)
        print(f"{'OK' if ok else 'FAIL'} | {uname:40s} | pwd_valid={ok} | is_active={u.is_active}")
    except User.DoesNotExist:
        print(f"MISS | {uname:40s} | NOT FOUND in DB")

# 2. Try generating a token
print("\n--- Token generation test ---")
try:
    u = User.objects.get(username="emna.awini@esprit.tn")
    refresh = RefreshToken.for_user(u)
    print(f"Access token: {str(refresh.access_token)[:40]}...")
    print("Token generation: OK")
except Exception as e:
    print(f"Token generation FAILED: {e}")

# 3. Simulate the TokenObtainPairView
print("\n--- Simulated TokenObtainPairView ---")
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
data = {"username": "emna.awini@esprit.tn", "password": "emma123"}
try:
    ser = TokenObtainPairSerializer(data=data)
    if ser.is_valid():
        print("Login OK:", ser.validated_data.keys())
    else:
        print("Login FAILED:", ser.errors)
except Exception as e:
    print(f"Login EXCEPTION: {type(e).__name__}: {e}")
