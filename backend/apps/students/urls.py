from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentPreferenceViewSet,
    CohortViewSet,
    MyTeamView,
    TeamViewSet,
    StudentProfileViewSet,
    MyProfileView,
)

router = DefaultRouter()
router.register(r"preferences", StudentPreferenceViewSet, basename="preference")
router.register(r"cohorts", CohortViewSet, basename="cohort")
router.register(r"teams", TeamViewSet, basename="team")
router.register(r"profiles", StudentProfileViewSet, basename="student-profile")

urlpatterns = [
    path("", include(router.urls)),
    path("my-team/", MyTeamView.as_view(), name="my-team"),
    path("my-profile/", MyProfileView.as_view(), name="my-profile"),
]
