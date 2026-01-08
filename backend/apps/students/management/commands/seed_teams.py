from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.students.models import Cohort, StudentProfile
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = "Seed team matching test data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding team matching data...")

        # Create Cohorts
        cohort_a, _ = Cohort.objects.get_or_create(
            name="Cohort A",
            defaults={
                "start_date": date(2024, 1, 1),
                "end_date": date(2024, 6, 1),
            },
        )

        cohort_b, _ = Cohort.objects.get_or_create(
            name="Cohort B",
            defaults={
                "start_date": date(2024, 7, 1),
                "end_date": date(2024, 12, 1),
            },
        )

        # Create Students for Cohort A
        for i in range(1, 11):
            email = f"student_a_{i}@example.com"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": f"student_a_{i}",
                    "first_name": "StudentA",
                    "last_name": f"{i}",
                    "role": "student",
                },
            )
            if created:
                user.set_password("password123")
                user.save()

            profile, _ = StudentProfile.objects.get_or_create(user=user)
            profile.cohort = cohort_a
            profile.student_id = f"SA{i:03d}"
            profile.enrollment_date = date(2024, 1, 1)
            profile.save()

        # Create Students for Cohort B
        for i in range(1, 11):
            email = f"student_b_{i}@example.com"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": f"student_b_{i}",
                    "first_name": "StudentB",
                    "last_name": f"{i}",
                    "role": "student",
                },
            )
            if created:
                user.set_password("password123")
                user.save()

            profile, _ = StudentProfile.objects.get_or_create(user=user)
            profile.cohort = cohort_b
            profile.student_id = f"SB{i:03d}"
            profile.enrollment_date = date(2024, 7, 1)
            profile.save()

        self.stdout.write(self.style.SUCCESS("Successfully seeded team matching data!"))
