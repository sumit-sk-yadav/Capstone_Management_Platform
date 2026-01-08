from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    StudentRegistrationView,
    ProfessorRegistrationView,
    AdminRegistrationView,
    LoginView,
    LogoutView,
    CurrentUserView,
)

urlpatterns = [
    # Three separate registration URLs - one for each user type
    path(
        "register/student/", StudentRegistrationView.as_view(), name="student-register"
    ),
    path(
        "register/professor/",
        ProfessorRegistrationView.as_view(),
        name="professor-register",
    ),
    path(
        "register/admin/",
        AdminRegistrationView.as_view(),
        name="admin-register",
    ),
    # JWT Login (for students and professors only)
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    # Token management
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Current user
    path("me/", CurrentUserView.as_view(), name="current-user"),
]
