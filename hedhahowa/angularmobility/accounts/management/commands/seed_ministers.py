"""
Management command to create the four minister users for demo/testing.
Usage: python manage.py seed_ministers
"""
from django.core.management.base import BaseCommand
from accounts.models import User


MINISTERS = [
    {"username": "emna.awini@esprit.tn", "ministry": "transport", "email": "emna.awini@esprit.tn", "pwd": "emma123"},
    {"username": "Ayed.rayen@esprit.tn", "ministry": "interieur", "email": "Ayed.rayen@esprit.tn", "pwd": "Realmadridftw123."},
    {"username": "amenagement@sasa.gov.ma", "ministry": "amenagement", "email": "amenagement@sasa.gov.ma", "pwd": "urbain2026"},
    {"username": "transition@sasa.gov.ma", "ministry": "transition", "email": "transition@sasa.gov.ma", "pwd": "urbain2026"},
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
        admin_user, admin_created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@sasa.gov.ma",
                "ministry": "transport",
                "is_staff": True,
                "is_superuser": True,
            }
        )
        admin_user.set_password("admin2026")
        admin_user.save()
        status = "Created" if admin_created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"  {status} superuser: admin"))

        self.stdout.write(self.style.SUCCESS(f"\nAll ministers ready."))
