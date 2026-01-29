import os
import django
import sys

def print_flush(*args, **kwargs):
    print(*args, **kwargs, flush=True)

print_flush("Setting up Django...")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
print_flush("Django setup complete.")

from apps.students.models import Cohort, StudentProfile, Team
from apps.students.services import TeamMatchingService
from django.contrib.auth import get_user_model

User = get_user_model()

def verify_single_cohort():
    print_flush("--- Verifying Single Cohort ---")
    cohort_count = Cohort.objects.count()
    print_flush(f"Cohort count: {cohort_count}")
    if cohort_count == 1:
        print_flush("SUCCESS: Only one cohort exists.")
        return True
    else:
        print_flush(f"FAILURE: Expected 1 cohort, found {cohort_count}")
        return False

def verify_team_matching():
    print_flush("\n--- Verifying Team Matching ---")
    # Check initial state
    initial_teams = Team.objects.count()
    print_flush(f"Initial teams: {initial_teams}")
    
    # Run auto-match
    print_flush("Running auto-match...")
    service = TeamMatchingService()
    created_teams = service.auto_match_students()
    
    print_flush(f"Teams created by service: {len(created_teams)}")
    
    # Check final state
    final_teams = Team.objects.count()
    print_flush(f"Final teams in DB: {final_teams}")
    
    if len(created_teams) > 0:
        print_flush("SUCCESS: Teams were created.")
        for team in created_teams:
            print_flush(f" - {team.name}: {team.members.count()} members")
    else:
        # It's possible no match was found if students are too few, but with 15 students seeded and default sizes (3-5), we should get teams.
        students_seeking = StudentProfile.objects.filter(seeking_team=True, team__isnull=True).count()
        print_flush(f"Students still seeking team: {students_seeking}")
        if students_seeking > 0:
             print_flush("FAILURE: Students are seeking teams but none were created.")
        else:
             print("INFO: No students needed matching or matching not possible/needed.")

if __name__ == "__main__":
    if verify_single_cohort():
        verify_team_matching()
