from apps.students.models import Cohort
from datetime import date, timedelta

def get_current_cohort():
    """
    Returns the single active cohort for the platform.
    If multiple exist, returns the first one (or raises error if strictness needed).
    If none exist, creates a default one.
    """
    cohort = Cohort.objects.first()
    if not cohort:
        cohort = Cohort.objects.create(
            name="Current Cohort",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=180),
            is_active=True
        )
    return cohort
