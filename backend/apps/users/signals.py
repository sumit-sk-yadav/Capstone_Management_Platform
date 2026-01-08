from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.students.models import StudentProfile
from apps.professors.models import ProfessorProfile
from apps.admin.models import AdminProfile
import uuid

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == "student":
            StudentProfile.objects.create(
                user=instance, student_id=str(uuid.uuid4())[:8]
            )
        elif instance.role == "professor":
            ProfessorProfile.objects.create(
                user=instance, employee_id=str(uuid.uuid4())[:8]
            )
        elif instance.role == "admin":
            AdminProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if instance.role == "student" and hasattr(instance, "student_profile"):
        instance.student_profile.save()
    elif instance.role == "professor" and hasattr(instance, "professor_profile"):
        instance.professor_profile.save()
    elif instance.role == "admin" and hasattr(instance, "admin_profile"):
        instance.admin_profile.save()
