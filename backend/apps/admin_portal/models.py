from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminProfile(models.Model):
    """Extended profile for admin users"""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="admin_profile"
    )
    department = models.CharField(max_length=100, blank=True)
    permissions_level = models.CharField(max_length=50, default="standard")

    def __str__(self):
        return f"{self.user.email} - Admin"
