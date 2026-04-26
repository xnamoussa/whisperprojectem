#!/bin/bash
set -e

echo "🔄 Running migrations..."
python manage.py migrate --noinput 2>/dev/null || echo "⚠️ Migration skipped (DB may not be ready)"

echo "🌱 Seeding minister users..."
python manage.py seed_ministers 2>/dev/null || echo "⚠️ Seed skipped"

echo "🚀 Starting Gunicorn server on 0.0.0.0:8000..."
exec gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile - --error-logfile - backend.wsgi:application
