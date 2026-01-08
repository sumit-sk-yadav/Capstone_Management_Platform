from rest_framework import viewsets, status, permissions
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

        cohort = get_object_or_404(Cohort, id=cohort_id)

        # 1. Build Graph
        G = nx.DiGraph()
        students = StudentProfile.objects.filter(cohort=cohort)
        student_ids = [s.id for s in students]
        G.add_nodes_from(student_ids)

        preferences = StudentPreference.objects.filter(student__in=students)
        for pref in preferences:
            # Add edge with weight based on rank (lower rank = higher preference)
            G.add_edge(
                pref.student.id, pref.preferred_student.id, weight=1.0 / pref.rank
            )

        # 2. Identify Components (groups)
        # Convert to undirected to find connected components
        G_undirected = G.to_undirected()
        components = list(nx.connected_components(G_undirected))

        # Reset existing teams for this cohort?
        # For now, let's assume we are generating fresh or appending.
        # Strategy: Clear existing teams for this cohort to avoid conflicts
        Team.objects.filter(cohort=cohort).delete()

        generated_teams = []

        # 3. Create Teams from components
        for i, component in enumerate(components):
            # Simple logic: each component becomes a team
            # TODO: Handle max/min size constraints
            members = list(component)
            team_name = f"Team {i + 1}"
            team = Team.objects.create(name=team_name, cohort=cohort)

            StudentProfile.objects.filter(id__in=members).update(team=team)
            generated_teams.append(team)

        serializer = TeamSerializer(generated_teams, many=True)
        return Response(
            {
                "message": f"Generated {len(generated_teams)} teams",
                "teams": serializer.data,
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


class CohortViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Cohort.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    serializer_class = CohortSerializer
