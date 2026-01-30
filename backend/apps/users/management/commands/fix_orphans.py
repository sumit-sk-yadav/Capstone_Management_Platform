from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.students.models import StudentProfile, Cohort
from apps.professors.models import ProfessorProfile
from apps.admin_portal.models import AdminProfile
import uuid
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = "Fix orphaned users (users without profiles)"

    def handle(self, *args, **options):
        self.stdout.write("Checking for orphaned users...")
        
        # 1. Fix Students
        students = User.objects.filter(role="student")
        fixed_students = 0
        
        # Get or create a default cohort if needed
        from apps.common.utils import get_current_cohort
        cohort = get_current_cohort()

        for user in students:
            if not hasattr(user, "student_profile"):
                self.stdout.write(f"Fixing student: {user.email}")
                StudentProfile.objects.create(
                    user=user,
                    student_id=str(uuid.uuid4())[:8],
                    cohort=cohort,
                    enrollment_date=date.today()
                )
                fixed_students += 1
                
        # 2. Fix Professors
        professors = User.objects.filter(role="professor")
        fixed_profs = 0
        for user in professors:
            if not hasattr(user, "professor_profile"):
                self.stdout.write(f"Fixing professor: {user.email}")
                ProfessorProfile.objects.create(
                    user=user,
                    employee_id=str(uuid.uuid4())[:8]
                )
                fixed_profs += 1
                
        # 3. Fix Admins
        admins = User.objects.filter(role="admin")
        fixed_admins = 0
        for user in admins:
            if not hasattr(user, "admin_profile"):
                self.stdout.write(f"Fixing admin: {user.email}")
                AdminProfile.objects.create(user=user)
                fixed_admins += 1
        
        self.stdout.write(self.style.SUCCESS(
            f"Fixed {fixed_students} students, {fixed_profs} professors, {fixed_admins} admins."
        ))
