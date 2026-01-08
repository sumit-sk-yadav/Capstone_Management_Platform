from rest_framework import serializers
from .models import StudentPreference, Team, StudentProfile, Cohort


class CohortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohort
        fields = ["id", "name", "start_date", "end_date", "is_active"]


class StudentProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = StudentProfile
        fields = ["id", "student_id", "email", "first_name", "last_name", "team"]


class StudentPreferenceSerializer(serializers.ModelSerializer):
    preferred_student_details = StudentProfileSerializer(
        source="preferred_student", read_only=True
    )

    class Meta:
        model = StudentPreference
        fields = [
            "id",
            "student",
            "preferred_student",
            "preferred_student_details",
            "rank",
            "created_at",
        ]
        read_only_fields = ["student", "created_at"]

    def validate(self, data):
        # Additional validation can go here if needed, but model validation handles most
        return data


class TeamSerializer(serializers.ModelSerializer):
    members = StudentProfileSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ["id", "name", "cohort", "members", "created_at"]
