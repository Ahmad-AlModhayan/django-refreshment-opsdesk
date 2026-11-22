"""
Lifecycle Stage: DRF Permission Gate -> Object-Level RBAC Enforcement
Production Invariant (🔴): Standard users can read tickets, but only the author or staff may mutate an object.
Trap Prevented (⚠️): IDOR (Insecure Direct Object Reference) when custom @action handlers bypass get_object().
"""
from typing import Any

from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class IsAuthorOrStaff(BasePermission):
    """Allows read-only access to authenticated users and write access to the ticket author or staff."""

    message = "Only the ticket author or staff members can modify this resource."

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff or request.user.is_superuser:
            return True
        return getattr(obj, "author_id", None) == request.user.id
