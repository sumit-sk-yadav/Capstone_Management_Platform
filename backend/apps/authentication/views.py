from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model


from .serializers import (
    StudentRegistrationSerializer,
    ProfessorRegistrationSerializer,
    AdminRegistrationSerializer,
    LoginSerializer,
    UserSerializer,
)

User = get_user_model()


class StudentRegistrationView(generics.CreateAPIView):
    """
    Student Registration Endpoint - Separate URL
    POST /api/auth/register/student/
    """

    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "message": "Student registered successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class ProfessorRegistrationView(generics.CreateAPIView):
    """
    Professor Registration Endpoint - Separate URL
    POST /api/auth/register/professor/
    """

    serializer_class = ProfessorRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "message": "Professor registered successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class AdminRegistrationView(generics.CreateAPIView):
    """
    Admin Registration Endpoint - Separate URL
    POST /api/auth/register/admin/
    """

    serializer_class = AdminRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "message": "Admin registered successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    JWT Login for Students and Professors
    POST /api/auth/login/
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)

        if user is None:
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )

        # Removed admin check to allow JWT login for admins
        # if user.role == "admin":
        #     return Response(
        #         {"error": "Admins must login through Google OAuth"},
        #         status=status.HTTP_403_FORBIDDEN,
        #     )

        if not user.is_active:
            return Response(
                {"error": "Account is disabled"}, status=status.HTTP_403_FORBIDDEN
            )

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    Logout endpoint
    POST /api/auth/logout/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Successfully logged out"}, status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class CurrentUserView(APIView):
    """
    GET current user profile
    GET /api/users/me/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
