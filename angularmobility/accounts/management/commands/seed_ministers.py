"""
Management command to create the four minister users for demo/testing.
Usage: python manage.py seed_ministers
"""
from django.core.management.base import BaseCommand
from accounts.models import User


MINISTERS = [
    {"username": "ministre.transport", "ministry": "transport", "email": "transport@sasa.gov.ma", "pwd": "sasa2026"},
    {"username": "Ayed.rayen@esprit.tn", "ministry": "interieur", "email": "Ayed.rayen@esprit.tn", "pwd": "Realmadridftw123."},
    {"username": "ministre.amenagement", "ministry": "amenagement", "email": "amenagement@sasa.gov.ma", "pwd": "sasa2026"},
    {"username": "ministre.transition", "ministry": "transition", "email": "transition@sasa.gov.ma", "pwd": "sasa2026"},
]


class Command(BaseCommand):
    help = "Seed the database with 4 minister users"

    def handle(self, *args, **options):
        for m in MINISTERS:
            user, created = User.objects.get_or_create(
                username=m["username"],
                defaults={
                    "ministry": m["ministry"],
                    "email": m["email"],
                },
            )
            # Always update password to match the requested creds
            user.set_password(m["pwd"])
            user.save()
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"  {status}: {user.username} ({user.ministry})"))

        # Superuser
        if not User.objects.filter(is_superuser=True).exists():
            admin_user = User.objects.create_superuser(
                username="admin",
                password="admin2026",
                email="admin@sasa.gov.ma",
                ministry="transport",
            )
            self.stdout.write(self.style.SUCCESS(f"  Created superuser: admin"))

        self.stdout.write(self.style.SUCCESS(f"\nAll ministers ready."))
