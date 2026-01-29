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
            "min_team_size",
            "max_team_size",
            "allow_solo_projects",
            "auto_matching_strategy",
            "team_formation_deadline",
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
            "skills",
            "seeking_team",
            "assignment_status",
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
        # Check for duplicates
        request = self.context.get("request")
        if request and hasattr(request.user, "student_profile"):
            student = request.user.student_profile
            preferred = data.get("preferred_student")
            
            if StudentPreference.objects.filter(
                student=student, preferred_student=preferred
            ).exists():
                raise serializers.ValidationError(
                    {"preferred_student": "You have already nominated this student."}
                )
        
        return data


class TeamSerializer(serializers.ModelSerializer):
    current_size = serializers.IntegerField(read_only=True)
    member_count = serializers.IntegerField(source="current_size", read_only=True)
    remaining_slots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    members = StudentProfileSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "cohort",
            "members",
            "current_size",
            "member_count",
            "remaining_slots",
            "is_full",
            "is_solo",
            "status",
            "target_size",
            "creation_method",
            "is_locked",
            "created_at",
        ]


class UnassignedStudentSerializer(serializers.Serializer):
    """For unassigned students view"""

    id = serializers.IntegerField()
    student_id = serializers.CharField()
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    seeking_team = serializers.BooleanField()
    assignment_status = serializers.CharField()
