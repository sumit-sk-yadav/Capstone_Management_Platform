from django.db import models
from apps.students.models import Cohort


class Course(models.Model):
    """Course model shared across cohorts and professors"""

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name="courses")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"
