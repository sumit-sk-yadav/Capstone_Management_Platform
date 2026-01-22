from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.students.models import Cohort

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with dynamic number of users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--students", type=int, default=10, help="Number of students to create"
        )
        parser.add_argument(
            "--professors", type=int, default=3, help="Number of professors to create"
        )
        parser.add_argument(
            "--admins", type=int, default=1, help="Number of admins to create"
        )
        parser.add_argument(
            "--cohort", type=str, default="2026-A", help="Default cohort name"
        )

    def handle(self, *args, **options):
        num_students = options["students"]
        num_professors = options["professors"]
        num_admins = options["admins"]
        cohort_name = options["cohort"]

        self.stdout.write(
            f"Seeding {num_students} students, {num_professors} professors, and {num_admins} admins..."
        )

        with transaction.atomic():
            # Create or get cohort
            from datetime import date, timedelta

            cohort, created = Cohort.objects.get_or_create(
                name=cohort_name,
                defaults={
                    "start_date": date.today(),
                    "end_date": date.today() + timedelta(days=180),
                },
            )

            # Create Admins
            for i in range(num_admins):
                email = f"admin{i + 1}@example.com"
                if not User.objects.filter(email=email).exists():
                    user = User.objects.create_user(
                        email=email,
                        username=f"admin{i + 1}",
                        password="password123",
                        role="admin",
                        first_name="Admin",
                        last_name=str(i + 1),
                    )
                    # Profile is created via signals
                    self.stdout.write(self.style.SUCCESS(f"Created admin: {email}"))

            # Create Professors
            for i in range(num_professors):
                email = f"prof{i + 1}@example.com"
                if not User.objects.filter(email=email).exists():
                    user = User.objects.create_user(
                        email=email,
                        username=f"prof{i + 1}",
                        password="password123",
                        role="professor",
                        first_name="Prof",
                        last_name=str(i + 1),
                    )
                    # Profile updated via signal, but let's set some fields if needed
                    profile = user.professor_profile
                    profile.department = "Computer Science"
                    profile.save()
                    self.stdout.write(self.style.SUCCESS(f"Created professor: {email}"))

            # Create Students
            for i in range(num_students):
                email = f"student{i + 1}@example.com"
                if not User.objects.filter(email=email).exists():
                    user = User.objects.create_user(
                        email=email,
                        username=f"student{i + 1}",
                        password="password123",
                        role="student",
                        first_name="Student",
                        last_name=str(i + 1),
                    )
                    profile = user.student_profile
                    profile.cohort = cohort
                    profile.enrollment_date = date.today()
                    profile.save()
                    self.stdout.write(self.style.SUCCESS(f"Created student: {email}"))

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
