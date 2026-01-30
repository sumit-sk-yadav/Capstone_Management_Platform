from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, F
from django.db import transaction
from .models import StudentPreference, StudentProfile, Team, Cohort
from .services import TeamMatchingService
from apps.common.utils import get_current_cohort
from .serializers import (
    StudentPreferenceSerializer,
    TeamSerializer,
    StudentProfileSerializer,
    CohortSerializer,
    UnassignedStudentSerializer,
)


class StudentPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = StudentPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        # Return preferences for the current student
        try:
            profile = self.request.user.student_profile
            return StudentPreference.objects.filter(student=profile)
        except AttributeError:
            return StudentPreference.objects.none()

    def perform_create(self, serializer):
        # Automatically set the student to the current user
        serializer.save(student=self.request.user.student_profile)

    @action(detail=False, methods=["get"])
    def candidates(self, request):
        """Return list of potential teammates (same cohort, excluding self)."""
        try:
            profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
             return Response(
                {"error": "Student profile not found. Please contact support."},
                status=status.HTTP_403_FORBIDDEN,
            )
        except AttributeError:
            return Response(
                {"error": "User does not have a student profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not profile.cohort:
            # If student has no cohort, try to assign current one or return empty
            profile.cohort = get_current_cohort()
            profile.save()

        candidates = StudentProfile.objects.filter(cohort=profile.cohort).exclude(
            id=profile.id
        )

        serializer = StudentProfileSerializer(candidates, many=True)
        return Response(serializer.data)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_permissions(self):
        if self.action in [
            "auto_match",
            "unassigned",
            "add_member",
            "remove_member",
            "dissolve",
        ]:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    def get_queryset(self):
        cohort_id = self.request.query_params.get('cohort_id')
        if cohort_id:
            return Team.objects.filter(cohort_id=cohort_id)
        # Fallback to current cohort
        cohort = get_current_cohort()
        return Team.objects.filter(cohort=cohort)

    @action(detail=False, methods=["post"])
    def dissolve(self, request):
        """Dissolve all teams for a specific cohort"""
        cohort_id = request.data.get("cohort_id")
        if cohort_id:
            cohort = get_object_or_404(Cohort, id=cohort_id)
        else:
            cohort = get_current_cohort()

        try:
            with transaction.atomic():
                # Reset student statuses first
                StudentProfile.objects.filter(cohort=cohort).update(
                    team=None, assignment_status="unassigned", is_solo=False
                )

                # Then delete teams
                count, _ = Team.objects.filter(cohort=cohort).delete()

            return Response({"message": f"Successfully dissolved {count} teams"})
        except Exception as e:
            return Response({"error": f"Failed to dissolve teams: {str(e)}"}, status=500)

    @action(detail=False, methods=["post"])
    def auto_match(self, request):
        """Admin triggers auto-matching for current cohort"""
        cohort_id = request.data.get("cohort_id")
        if cohort_id:
            cohort = get_object_or_404(Cohort, id=cohort_id)
        else:
            cohort = get_current_cohort()

        target_size = request.data.get("target_size")
        if target_size:
            try:
                target_size = int(target_size)
            except (ValueError, TypeError):
                return Response({"error": "Invalid target_size"}, status=400)

        # Ensure we are using the service for the correct cohort
        service = TeamMatchingService(cohort=cohort)
        
        try:
            with transaction.atomic():
                # If we are re-matching, we should dissolve existing teams first
                # to ensure everyone is available for the new match
                if request.data.get("dissolve_first", True):
                    StudentProfile.objects.filter(cohort=service.cohort).update(
                        team=None, assignment_status="unassigned", is_solo=False
                    )
                    Team.objects.filter(cohort=service.cohort).delete()

                teams = service.auto_match_students(pref_size=target_size)

            return Response(
                {
                    "message": f"Created {len(teams)} teams",
                    "teams": TeamSerializer(teams, many=True).data,
                }
            )
        except Exception as e:
            return Response({"error": f"Auto-match failed: {str(e)}"}, status=500)

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        """Student joins existing team"""
        team = self.get_object()
        try:
            student_profile = request.user.student_profile
        except AttributeError:
            return Response(
                {"error": "User does not have a student profile"}, status=403
            )

        from django.core.exceptions import ValidationError

        try:
            team.add_member(student_profile)
            return Response({"message": "Successfully joined team"})
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=False, methods=["get"])
    def unassigned(self, request):
        """Get list of unassigned students"""
        cohort = get_current_cohort()

        students = (
            StudentProfile.objects.filter(
                cohort=cohort, team__isnull=True, seeking_team=True
            )
            .select_related("user")
            .order_by("user__last_name")
        )

        serializer = UnassignedStudentSerializer(students, many=True)
        return Response({"count": students.count(), "students": serializer.data})

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        team = self.get_object()
        student_id = request.data.get("student_id")

        if not student_id:
            return Response({"error": "student_id is required"}, status=400)

        student = get_object_or_404(StudentProfile, id=student_id)

        from django.core.exceptions import ValidationError

        try:
            team.add_member(student)
            return Response(TeamSerializer(team).data)
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        team = self.get_object()
        student_id = request.data.get("student_id")

        if not student_id:
            return Response({"error": "student_id is required"}, status=400)

        student = get_object_or_404(StudentProfile, id=student_id)

        if student.team != team:
            return Response({"error": "Student is not in this team"}, status=400)

        team.remove_member(student)
        return Response(TeamSerializer(team).data)


class CohortViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    serializer_class = CohortSerializer

    def get_queryset(self):
        # Admin can see all cohorts, students only see active or their own if needed
        if self.request.user.role == 'admin':
            return Cohort.objects.all()
        return Cohort.objects.filter(is_active=True)

    def get_permissions(self):
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "toggle_lock",
        ]:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    @action(detail=True, methods=["get"])
    def students(self, request, pk=None):
        """Get all students in a specific cohort with their team assignments."""
        cohort = self.get_object()
        students = StudentProfile.objects.filter(cohort=cohort).select_related(
            "user", "team"
        )
        serializer = StudentProfileSerializer(students, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def toggle_lock(self, request, pk=None):
        cohort = self.get_object()
        cohort.teams_locked = not cohort.teams_locked
        cohort.save()
        return Response(
            {
                "teams_locked": cohort.teams_locked,
                "message": f"Cohort teams {'locked' if cohort.teams_locked else 'unlocked'}",
            }
        )


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_permissions(self):
        if self.action in [
            "assign_solo_projects",
            "finalize_teams",
            "mark_solo",
            "unmark_solo",
        ]:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    @action(detail=False, methods=["post"])
    def request_team(self, request):
        """Student requests team assignment"""
        try:
            profile = request.user.student_profile
        except AttributeError:
            return Response(
                {"error": "User does not have a student profile"}, status=403
            )

        # Update assignment status if unassigned
        if profile.assignment_status == "unassigned":
            profile.assignment_status = "unassigned"  # redundant but explicit
            profile.seeking_team = True
            profile.save()

        # Try to find compatible team
        compatible_teams = (
            Team.objects.filter(cohort=profile.cohort, is_locked=False, is_solo=False)
            .annotate(size=Count("members"))
            .filter(size__lt=F("target_size"))
        )

        if compatible_teams.exists():
            team = compatible_teams.first()
            from django.core.exceptions import ValidationError

            try:
                team.add_member(profile)
                return Response(
                    {
                        "message": "Matched to existing team",
                        "team": TeamSerializer(team).data,
                    }
                )
            except ValidationError as e:
                return Response({"error": str(e)}, status=400)

        return Response({"message": "Request received, waiting for auto-match"})

    @action(detail=False, methods=["post"])
    def assign_solo_projects(self, request):
        """Admin assigns students to solo projects"""
        student_ids = request.data.get("student_ids", [])
        
        service = TeamMatchingService()

        from django.core.exceptions import ValidationError

        try:
            service.assign_solo_projects(student_ids)
            return Response({"message": f"Assigned {len(student_ids)} solo projects"})
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=False, methods=["post"])
    def finalize_teams(self, request):
        """Finalize all teams in cohort"""
        cohort = get_current_cohort()

        # Use service to finalize
        service = TeamMatchingService(cohort=cohort)
        dissolved = service.finalize_cohort()

        return Response({"message": f"Teams finalized. {dissolved} incomplete teams dissolved."})

    @action(detail=False, methods=["post"])
    def mark_solo(self, request):
        student_id = request.data.get("student_id")
        if not student_id:
            return Response({"error": "student_id is required"}, status=400)

        student = get_object_or_404(StudentProfile, id=student_id)

        # Remove from team if in one
        if student.team:
            student.team.remove_member(student)

        student.is_solo = True
        student.assignment_status = "solo_assigned"
        student.save()

        return Response(StudentProfileSerializer(student).data)

    @action(detail=False, methods=["post"])
    def unmark_solo(self, request):
        student_id = request.data.get("student_id")
        if not student_id:
            return Response({"error": "student_id is required"}, status=400)

        student = get_object_or_404(StudentProfile, id=student_id)

        student.is_solo = False
        student.assignment_status = "unassigned"
        student.save()

        return Response(StudentProfileSerializer(student).data)


class MyTeamView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.student_profile
            if profile.team:
                return Response(TeamSerializer(profile.team).data)
            return Response({"message": "No team assigned"}, status=200)
        except (StudentProfile.DoesNotExist, AttributeError):
            return Response({"error": "Profile not found"}, status=404)


class MyProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.student_profile
            return Response(StudentProfileSerializer(profile).data)
        except (StudentProfile.DoesNotExist, AttributeError):
            return Response({"error": "Profile not found"}, status=404)
