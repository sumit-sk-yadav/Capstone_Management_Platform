from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    """Permission class for student-only access"""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"


class IsProfessor(permissions.BasePermission):
    """Permission class for professor-only access"""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "professor"


class IsAdmin(permissions.BasePermission):
    """Permission class for admin-only access"""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission class - owner can edit their own data, admin can edit all"""

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        return obj == request.user or (
            hasattr(obj, "user") and obj.user == request.user
        )
