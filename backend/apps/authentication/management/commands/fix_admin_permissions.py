"""
Management command to fix admin users' is_staff and is_superuser flags.
This ensures all users with role='admin' have the proper Django permissions.
"""

from django.core.management.base import BaseCommand
from apps.authentication.models import User


class Command(BaseCommand):
    help = "Fix admin users to have is_staff and is_superuser flags set correctly"

    def handle(self, *args, **options):
        # Find all admin users without proper flags
        admin_users = User.objects.filter(role="admin")
        fixed_count = 0

        for user in admin_users:
            needs_update = False

            if not user.is_staff:
                user.is_staff = True
                needs_update = True

            if not user.is_superuser:
                user.is_superuser = True
                needs_update = True

            if needs_update:
                user.save()
                fixed_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Fixed permissions for admin user: {user.email}"
                    )
                )

        if fixed_count == 0:
            self.stdout.write(
                self.style.SUCCESS("✓ All admin users already have correct permissions")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"\n✓ Fixed {fixed_count} admin user(s)")
            )

        # Also fix any role mismatch (staff users without admin role)
        staff_non_admins = User.objects.filter(is_staff=True).exclude(role="admin")
        if staff_non_admins.exists():
            self.stdout.write(
                self.style.WARNING(
                    f"\nWarning: Found {staff_non_admins.count()} staff user(s) without admin role:"
                )
            )
            for user in staff_non_admins:
                self.stdout.write(f"  - {user.email} (role: {user.role})")
