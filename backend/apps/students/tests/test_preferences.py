from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.students.models import StudentProfile, StudentPreference, Cohort
from rest_framework.test import APIClient
from rest_framework import status
import uuid
from datetime import date

User = get_user_model()

class StudentPreferenceTests(TestCase):
    def setUp(self):
        self.cohort = Cohort.objects.create(
            name="Cohort 2026",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31)
        )
        
        # Create Student 1 (User)
        self.user1 = User.objects.create_user(
            email="s1@example.com",
            username="student1_test",
            password="password", 
            role="student"
        )
        # Profile created by signal, get it
        self.student1 = self.user1.student_profile
        self.student1.cohort = self.cohort
        self.student1.save()
        
        # Create Student 2 (Candidate)
        self.user2 = User.objects.create_user(
            email="s2@example.com", 
            username="student2_test",
            password="password", 
            role="student"
        )
        self.student2 = self.user2.student_profile
        self.student2.cohort = self.cohort
        self.student2.save()
        
        self.client = APIClient()

    def test_create_duplicate_preference(self):
        self.client.force_authenticate(user=self.user1)
        
        # 1. Create initial preference
        data = {
            "preferred_student": self.student2.id,
            "rank": 1
        }
        response = self.client.post("/api/students/preferences/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Try to create SAME preference again
        response = self.client.post("/api/students/preferences/", data)
        
        # Expect 400 Bad Request (Validation Error), NOT 500
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Check error message
        self.assertIn("preferred_student", response.data)
        error_msg = str(response.data["preferred_student"][0])
        self.assertIn("You have already nominated this student", error_msg)
