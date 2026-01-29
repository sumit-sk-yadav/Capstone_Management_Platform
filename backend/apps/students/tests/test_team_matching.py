from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.students.models import StudentProfile, StudentPreference, Cohort, Team
from rest_framework.test import APIClient
from datetime import date

User = get_user_model()


class TeamMatchingTests(TestCase):
    def setUp(self):
        self.cohort = Cohort.objects.create(
            name="Test Cohort",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 6, 1),
            min_team_size=2,
            max_team_size=4,
            allow_solo_projects=True,
        )
        self.admin_user = User.objects.create_superuser(
            "admin", "admin@example.com", "password"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

        self.students = []
        for i in range(10):
            print(f"Setting up user {i}")
            user = User.objects.create_user(
                f"student{i}", f"student{i}@example.com", "password", role="student"
            )
            profile = user.student_profile
            profile.student_id = f"S{i}"
            profile.cohort = self.cohort
            profile.enrollment_date = date(2024, 1, 1)
            profile.save()
            self.students.append(profile)
        print("Setup complete")

    def test_auto_match_balanced(self):
        # 10 students, min 2, max 4. Should probably result in 3-4 teams.
        response = self.client.post(
            "/api/students/teams/auto_match/", {}
        )
        self.assertEqual(response.status_code, 200)

        # Verify everyone has a team
        for s in StudentProfile.objects.filter(cohort=self.cohort):
            s.refresh_from_db()
            self.assertIsNotNone(s.team)
            self.assertEqual(s.assignment_status, "in_team")

    def test_solo_assignment(self):
        s0 = self.students[0]
        response = self.client.post(
            "/api/students/profiles/assign_solo_projects/",
            {"student_ids": [s0.id]},
        )
        self.assertEqual(response.status_code, 200)

        s0.refresh_from_db()
        self.assertTrue(s0.is_solo)
        self.assertEqual(s0.assignment_status, "solo_assigned")
        self.assertIsNotNone(s0.team)
        self.assertTrue(s0.team.is_solo)

    def test_student_request_team(self):
        # Student 1 requests a team
        s1 = self.students[1]
        self.client.force_authenticate(user=s1.user)

        response = self.client.post("/api/students/profiles/request_team/")
        self.assertEqual(response.status_code, 200)

        s1.refresh_from_db()
        self.assertTrue(s1.seeking_team)

    def test_auto_match_with_preferences(self):
        # Configure cohort for preference-based matching
        self.cohort.auto_matching_strategy = "preference_based"
        self.cohort.save()

        # S2 and S3 prefer each other
        StudentPreference.objects.create(
            student=self.students[2], preferred_student=self.students[3]
        )
        StudentPreference.objects.create(
            student=self.students[3], preferred_student=self.students[2]
        )

        # S4 and S5 prefer each other
        StudentPreference.objects.create(
            student=self.students[4], preferred_student=self.students[5]
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            "/api/students/teams/auto_match/", {}
        )
        self.assertEqual(response.status_code, 200)

        s2 = StudentProfile.objects.get(student_id="S2")
        s3 = StudentProfile.objects.get(student_id="S3")
        s4 = StudentProfile.objects.get(student_id="S4")
        s5 = StudentProfile.objects.get(student_id="S5")

        # Must be in teams
        self.assertIsNotNone(s2.team)
        self.assertIsNotNone(s3.team)
        self.assertIsNotNone(s4.team)
        self.assertIsNotNone(s5.team)

        # Pairs should be together
        self.assertEqual(s2.team, s3.team, "S2 and S3 should be in the same team")
        self.assertEqual(s4.team, s5.team, "S4 and S5 should be in the same team")
        
        # Verify team validity
        self.assertTrue(s2.team.current_size >= self.cohort.min_team_size)

    def test_finalize_cohort(self):
        # Verify finalize logic
        self.client.force_authenticate(user=self.admin_user)
        
        # Create some solo students and partial teams first
        # Run finalize
        response = self.client.post("/api/students/profiles/finalize_teams/")
        self.assertEqual(response.status_code, 200)
        
        # Check that teams are locked
        for team in Team.objects.filter(cohort=self.cohort):
            if team.status == "complete":
                self.assertTrue(team.is_locked)
