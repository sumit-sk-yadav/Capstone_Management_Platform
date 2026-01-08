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
    enrollment_date = models.DateField(null=True, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.student_id}"


class StudentPreference(models.Model):
    """Model to store student preferences for teammates"""

    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name="preferences_made"
    )
    preferred_student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name="preferences_received"
    )
    rank = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["rank", "created_at"]
        unique_together = ["student", "preferred_student"]

    def __str__(self):
        return f"{self.student} -> {self.preferred_student} (Rank: {self.rank})"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.student == self.preferred_student:
            raise ValidationError("You cannot nominate yourself.")

        if self.student.cohort != self.preferred_student.cohort:
            raise ValidationError(
                "You can only nominate students from your own cohort."
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
