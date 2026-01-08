from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.students.models import StudentProfile, StudentPreference, Cohort, Team
from apps.students.views import TeamMatchingViewSet
from rest_framework.test import APIClient
from datetime import date

User = get_user_model()


class TeamMatchingTests(TestCase):
    def setUp(self):
        self.cohort = Cohort.objects.create(
            name="Test Cohort", start_date=date(2024, 1, 1), end_date=date(2024, 6, 1)
        )
        self.admin_user = User.objects.create_superuser(
            "admin", "admin@example.com", "password"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

        self.students = []
        for i in range(6):
            user = User.objects.create_user(
                f"student{i}", f"student{i}@example.com", "password"
            )
            profile = StudentProfile.objects.create(
                user=user,
                student_id=f"S{i}",
                cohort=self.cohort,
                enrollment_date=date(2024, 1, 1),
            )
            self.students.append(profile)

    def test_generate_teams_no_preferences(self):
        # Should generate single teams or random based on implementation (currently connected components)
        # Since no edges, everyone is a component of size 1.
        response = self.client.post(
            "/api/students/team-matching/generate/", {"cohort_id": self.cohort.id}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Team.objects.count(), 6)

        # Verify everyone has a team
        for s in StudentProfile.objects.filter(cohort=self.cohort):
            s.refresh_from_db()
            self.assertIsNotNone(s.team)

    def test_generate_teams_cliques(self):
        # S0-S1-S2 want to be together
        StudentPreference.objects.create(
            student=self.students[0], preferred_student=self.students[1]
        )
        StudentPreference.objects.create(
            student=self.students[1], preferred_student=self.students[2]
        )
        StudentPreference.objects.create(
            student=self.students[2], preferred_student=self.students[0]
        )

        # S3-S4 want to be together
        StudentPreference.objects.create(
            student=self.students[3], preferred_student=self.students[4]
        )

        # S5 is alone

        response = self.client.post(
            "/api/students/team-matching/generate/", {"cohort_id": self.cohort.id}
        )
        self.assertEqual(response.status_code, 200)

        # Should result in 3 teams: {0,1,2}, {3,4}, {5}
        self.assertEqual(Team.objects.count(), 3)

        s0 = StudentProfile.objects.get(student_id="S0")
        s1 = StudentProfile.objects.get(student_id="S1")
        s2 = StudentProfile.objects.get(student_id="S2")

        self.assertEqual(s0.team, s1.team)
        self.assertEqual(s1.team, s2.team)

    def test_cohort_isolation(self):
        other_cohort = Cohort.objects.create(
            name="Other Cohort", start_date=date(2024, 1, 1), end_date=date(2024, 6, 1)
        )
        other_user = User.objects.create_user("other", "other@example.com", "password")
        other_student = StudentProfile.objects.create(
            user=other_user,
            student_id="OS1",
            cohort=other_cohort,
            enrollment_date=date(2024, 1, 1),
        )

        # Try to match S0 with OS1 (should fail validation)
        with self.assertRaises(Exception):
            StudentPreference.objects.create(
                student=self.students[0], preferred_student=other_student
            )
