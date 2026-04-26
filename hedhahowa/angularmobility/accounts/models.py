from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Ministry(models.TextChoices):
        TRANSPORT = "transport", "Transport"
        INTERIEUR = "interieur", "Interieur"
        AMENAGEMENT = "amenagement", "Amenagement du territoire"
        TRANSITION = "transition", "Transition ecologique"

    ministry = models.CharField(
        max_length=50,
        choices=Ministry.choices,
        default=Ministry.TRANSPORT,
    )

    def __str__(self) -> str:
        return f"{self.username} ({self.ministry})"
