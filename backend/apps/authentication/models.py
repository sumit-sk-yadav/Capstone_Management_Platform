import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model with role-based authentication.
    Supports three user types: Admin, Student, Professor
    """

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("student", "Student"),
        ("professor", "Professor"),
    ]

    AUTH_PROVIDER_CHOICES = [
        ("jwt", "JWT"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name="Email Address")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    auth_provider = models.CharField(
        max_length=20, choices=AUTH_PROVIDER_CHOICES, default="jwt"
    )
    is_verified = models.BooleanField(default=False)

    # Override username to make it optional for Google OAuth users (No longer needed strictly for Google but good for flexibility)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)

    # Make email the primary login field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self.username:
            self.username = self.email.split("@")[0] + str(uuid.uuid4())[:8]

        # Automatically set is_staff and is_superuser for admin users
        if self.role == "admin":
            self.is_staff = True
            self.is_superuser = True
        else:
            # Ensure non-admin users don't have these permissions
            if not self.is_superuser:  # Don't override manually set superusers
                self.is_staff = False

        super().save(*args, **kwargs)
