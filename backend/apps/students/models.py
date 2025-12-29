from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Cohort(models.Model):
    """Cohort model for grouping students"""

    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class Team(models.Model):
    """Team model for capstone projects"""

    name = models.CharField(max_length=100)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name="teams")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.cohort.name})"


class StudentProfile(models.Model):
    """Extended profile for student users"""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    student_id = models.CharField(max_length=50, unique=True)
    cohort = models.ForeignKey(
        Cohort,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    team = models.ForeignKey(
        Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="members"
    )
    enrollment_date = models.DateField()
    graduation_year = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.student_id}"
