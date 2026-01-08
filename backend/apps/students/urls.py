from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentPreferenceViewSet, TeamMatchingViewSet, CohortViewSet

router = DefaultRouter()
router.register(r"preferences", StudentPreferenceViewSet, basename="preference")
router.register(r"team-matching", TeamMatchingViewSet, basename="team-matching")
router.register(r"cohorts", CohortViewSet, basename="cohort")

urlpatterns = [
    path("", include(router.urls)),
]
