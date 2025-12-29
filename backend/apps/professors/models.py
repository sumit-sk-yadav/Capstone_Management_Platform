from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ProfessorProfile(models.Model):
    """Extended profile for professor users"""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="professor_profile"
    )
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100)
    specialization = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.employee_id}"
