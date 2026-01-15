from rest_framework import serializers
from .models import StudentPreference, Team, StudentProfile, Cohort


class CohortSerializer(serializers.ModelSerializer):
    total_students = serializers.SerializerMethodField()
    students_with_teams = serializers.SerializerMethodField()
    students_without_teams = serializers.SerializerMethodField()

    class Meta:
        model = Cohort
        fields = [
            "id",
            "name",
            "start_date",
            "end_date",
            "is_active",
            "teams_locked",
            "total_students",
            "students_with_teams",
            "students_without_teams",
        ]

    def get_total_students(self, obj):
        return obj.students.count()

    def get_students_with_teams(self, obj):
        return obj.students.filter(team__isnull=False).count()

    def get_students_without_teams(self, obj):
        return obj.students.filter(team__isnull=True).count()


class StudentProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "student_id",
            "email",
            "first_name",
            "last_name",
            "team",
            "is_solo",
            "cohort_id",
            "cohort_teams_locked",
        ]

    cohort_id = serializers.IntegerField(source="cohort.id", read_only=True)
    cohort_teams_locked = serializers.BooleanField(
        source="cohort.teams_locked", read_only=True
    )


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
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ["id", "name", "cohort", "members", "member_count", "created_at"]

    def get_member_count(self, obj):
        return obj.members.count()
