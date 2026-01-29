from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Cohort(models.Model):
    """Cohort model for grouping students"""

    AUTO_MATCHING_STRATEGIES = [
        ("balanced", "Equal-sized teams"),
        ("preference_based", "Honor student preferences"),
        ("fill_existing", "Fill incomplete teams first"),
    ]

    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    teams_locked = models.BooleanField(default=False)
    min_team_size = models.IntegerField(default=3)
    max_team_size = models.IntegerField(default=5)
    allow_solo_projects = models.BooleanField(default=False)
    auto_matching_strategy = models.CharField(
        max_length=20, choices=AUTO_MATCHING_STRATEGIES, default="balanced"
    )
    team_formation_deadline = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class Team(models.Model):
    """Team model for capstone projects"""

    CREATION_METHODS = [
        ("manual_student", "Student Formed"),
        ("manual_admin", "Admin Formed"),
        ("auto_matched", "Auto Matched"),
        ("solo_assignment", "Solo Assignment"),
    ]

    STATUS_CHOICES = [
        ("forming", "Forming"),
        ("complete", "Complete"),
        ("locked", "Locked"),
        ("solo", "Solo"),
    ]

    name = models.CharField(max_length=100)
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name="teams")
    is_solo = models.BooleanField(default=False)
    target_size = models.IntegerField(default=5)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="forming")
    is_locked = models.BooleanField(default=False)
    creation_method = models.CharField(
        max_length=20, choices=CREATION_METHODS, default="manual_student"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.cohort.name})"

    @property
    def current_size(self):
        return self.members.count()

    @property
    def is_full(self):
        return self.current_size >= self.target_size

    @property
    def is_within_limits(self):
        return (
            self.cohort.min_team_size <= self.current_size <= self.cohort.max_team_size
        )

    @property
    def remaining_slots(self):
        return max(0, self.target_size - self.current_size)

    def can_add_member(self):
        if self.is_locked:
            return False
        if self.is_solo:
            return self.current_size < 1
        return self.current_size < self.cohort.max_team_size

    def add_member(self, student_profile):
        from django.core.exceptions import ValidationError

        if not self.can_add_member():
            raise ValidationError("Team is full or locked.")
        if student_profile.cohort != self.cohort:
            raise ValidationError("Student is from a different cohort.")

        student_profile.team = self
        student_profile.assignment_status = "in_team"
        student_profile.is_solo = self.is_solo
        student_profile.save()
        self.update_status()

    def remove_member(self, student_profile):
        if student_profile.team == self:
            student_profile.team = None
            student_profile.assignment_status = "unassigned"
            student_profile.is_solo = False
            student_profile.save()
            self.update_status()

    def update_status(self):
        if self.is_solo:
            self.status = "solo"
        elif self.is_locked:
            self.status = "locked"
        elif self.current_size >= self.target_size:
            self.status = "complete"
        else:
            self.status = "forming"
        self.save()


class StudentProfile(models.Model):
    """Extended profile for student users"""

    ASSIGNMENT_STATUS_CHOICES = [
        ("unassigned", "Unassigned"),
        ("in_team", "In Team"),
        ("solo_assigned", "Solo Assigned"),
        ("opted_out", "Opted Out"),
    ]

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
    skills = models.JSONField(default=list, blank=True)
    seeking_team = models.BooleanField(default=True)
    assignment_status = models.CharField(
        max_length=20, choices=ASSIGNMENT_STATUS_CHOICES, default="unassigned"
    )
    is_solo = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["student_id"]),
            models.Index(fields=["enrollment_date"]),
            models.Index(fields=["seeking_team"]),
            models.Index(fields=["assignment_status"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.student_id}"

    @property
    def has_team(self):
        return self.team is not None

    @property
    def is_solo_worker(self):
        return self.has_team and self.team.is_solo


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
