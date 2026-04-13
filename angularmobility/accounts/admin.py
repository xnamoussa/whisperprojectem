from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "ministry", "is_staff")
    list_filter = ("ministry", "is_staff", "is_superuser")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Ministry", {"fields": ("ministry",)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Ministry", {"fields": ("ministry",)}),
    )
