from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "auth_provider",
            "is_verified",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined", "auth_provider"]


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for student registration - separate endpoint"""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password2",
            "first_name",
            "last_name",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data.get("username"),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="student",
            auth_provider="jwt",
        )
        return user


class ProfessorRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for professor registration - separate endpoint"""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password2",
            "first_name",
            "last_name",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data.get("username"),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="professor",
            auth_provider="jwt",
        )
        return user


class AdminRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for admin registration - separate endpoint"""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password2",
            "first_name",
            "last_name",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data.get("username"),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="admin",
            auth_provider="jwt",
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login (both student and professor)"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
