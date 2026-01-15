from rest_framework import viewsets, status, permissions, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import networkx as nx
from .models import StudentPreference, StudentProfile, Team, Cohort
from .serializers import (
    StudentPreferenceSerializer,
    TeamSerializer,
    StudentProfileSerializer,
    CohortSerializer,
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
        except AttributeError:
            return Response(
                {"error": "User does not have a student profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not profile.cohort:
            return Response([], status=status.HTTP_200_OK)

        candidates = StudentProfile.objects.filter(cohort=profile.cohort).exclude(
            id=profile.id
        )

        serializer = StudentProfileSerializer(candidates, many=True)
        return Response(serializer.data)


class TeamMatchingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=["post"])
    def generate(self, request):
        cohort_id = request.data.get("cohort_id")
        if not cohort_id:
            return Response(
                {"error": "cohort_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get and validate team_size parameter
        team_size = request.data.get("team_size", 4)
        try:
            team_size = int(team_size)
            if team_size < 2:
                return Response(
                    {"error": "team_size must be at least 2"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if team_size > 10:
                return Response(
                    {"error": "team_size cannot exceed 10"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "team_size must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cohort = get_object_or_404(Cohort, id=cohort_id)

        # 1. Build Graph
        G = nx.DiGraph()
        students = StudentProfile.objects.filter(cohort=cohort)
        total_students = students.count()

        if total_students == 0:
            return Response(
                {"error": "No students in this cohort"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_ids = [s.id for s in students]
        G.add_nodes_from(student_ids)

        preferences = StudentPreference.objects.filter(student__in=students)
        for pref in preferences:
            # Add edge with weight based on rank (lower rank = higher preference)
            G.add_edge(
                pref.student.id, pref.preferred_student.id, weight=1.0 / pref.rank
            )

        # 2. Identify Components (groups based on preferences)
        G_undirected = G.to_undirected()
        components = list(nx.connected_components(G_undirected))

        # Reset existing teams for this cohort
        Team.objects.filter(cohort=cohort).delete()

        # 3. Process components based on target team size
        final_teams = []

        for component in components:
            component_size = len(component)

            if component_size <= team_size * 1.5:
                # Component is reasonable size, keep as one team
                final_teams.append(list(component))
            else:
                # Component is too large, split it
                # Calculate how many teams we need
                num_teams = max(2, round(component_size / team_size))
                component_list = list(component)

                # Simple split: divide as evenly as possible
                # In future, could use more sophisticated graph partitioning
                teams_from_component = []
                for i in range(num_teams):
                    start_idx = i * len(component_list) // num_teams
                    end_idx = (i + 1) * len(component_list) // num_teams
                    teams_from_component.append(component_list[start_idx:end_idx])

                final_teams.extend(teams_from_component)

        # 4. Merge very small teams
        small_teams = [t for t in final_teams if len(t) < team_size / 2]
        regular_teams = [t for t in final_teams if len(t) >= team_size / 2]

        # Combine small teams
        if small_teams:
            merged = []
            current_merge = []
            for small_team in small_teams:
                current_merge.extend(small_team)
                if len(current_merge) >= team_size / 2:
                    merged.append(current_merge)
                    current_merge = []

            # Add any remaining students to the last team or create new team
            if current_merge:
                if merged:
                    merged[-1].extend(current_merge)
                else:
                    merged.append(current_merge)

            regular_teams.extend(merged)

        final_teams = regular_teams

        # 5. Create Team objects
        generated_teams = []
        students_assigned = 0

        for i, members in enumerate(final_teams):
            team_name = f"Team {i + 1}"
            team = Team.objects.create(name=team_name, cohort=cohort)

            StudentProfile.objects.filter(id__in=members).update(team=team)
            generated_teams.append(team)
            students_assigned += len(members)

        serializer = TeamSerializer(generated_teams, many=True)
        return Response(
            {
                "message": f"Generated {len(generated_teams)} team(s) with {students_assigned} student(s) assigned (target size: {team_size})",
                "teams": serializer.data,
                "total_teams": len(generated_teams),
                "total_students": total_students,
                "students_assigned": students_assigned,
                "students_unassigned": total_students - students_assigned,
                "target_team_size": team_size,
            }
        )

    @action(detail=False, methods=["get"])
    def list_teams(self, request):
        cohort_id = request.query_params.get("cohort_id")
        if not cohort_id:
            return Response(
                {"error": "cohort_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        teams = Team.objects.filter(cohort_id=cohort_id)
        serializer = TeamSerializer(teams, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def dissolve_teams(self, request):
        cohort_id = request.data.get("cohort_id")
        if not cohort_id:
            return Response(
                {"error": "cohort_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        cohort = get_object_or_404(Cohort, id=cohort_id)

        # Check if teams are locked
        if cohort.teams_locked:
            return Response(
                {"error": "Cannot dissolve teams when cohort is locked."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete all teams for this cohort
        teams = Team.objects.filter(cohort=cohort)
        count = teams.count()

        # Explicitly clear student profiles to be sure
        StudentProfile.objects.filter(team__in=teams).update(team=None)

        teams.delete()

        return Response(
            {"message": f"Dissolved {count} teams for cohort {cohort.name}"}
        )


class CohortViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Cohort.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    serializer_class = CohortSerializer

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


class MyTeamView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.student_profile
        except AttributeError:
            return Response(
                {"error": "User does not have a student profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not profile.team:
            return Response(
                {"message": "You have not been assigned to a team yet."},
                status=status.HTTP_200_OK,
            )

        serializer = TeamSerializer(profile.team)
        return Response(serializer.data)


class MyProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.student_profile
        except AttributeError:
            return Response(
                {"error": "User does not have a student profile"},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        team = self.get_object()
        student_id = request.data.get("student_id")

        if not student_id:
            return Response(
                {"error": "student_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        student = get_object_or_404(StudentProfile, id=student_id)

        # Check if student is in the same cohort
        if student.cohort != team.cohort:
            return Response(
                {"error": "Student must be in the same cohort"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Move to team automatically implies not solo
        student.is_solo = False
        student.team = team
        student.save()

        serializer = TeamSerializer(team)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        team = self.get_object()
        student_id = request.data.get("student_id")

        if not student_id:
            return Response(
                {"error": "student_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        student = get_object_or_404(StudentProfile, id=student_id)

        if student.team != team:
            return Response(
                {"error": "Student is not in this team"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student.team = None
        student.save()

        serializer = TeamSerializer(team)
        return Response(serializer.data)


class StudentOpsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=["post"])
    def mark_solo(self, request):
        student_id = request.data.get("student_id")
        if not student_id:
            return Response(
                {"error": "student_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        student = get_object_or_404(StudentProfile, id=student_id)

        # Remove from team if in one
        student.team = None
        student.is_solo = True
        student.save()

        return Response(StudentProfileSerializer(student).data)

    @action(detail=False, methods=["post"])
    def unmark_solo(self, request):
        student_id = request.data.get("student_id")
        if not student_id:
            return Response(
                {"error": "student_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        student = get_object_or_404(StudentProfile, id=student_id)

        student.is_solo = False
        student.save()

        return Response(StudentProfileSerializer(student).data)
