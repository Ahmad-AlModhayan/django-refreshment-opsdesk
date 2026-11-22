"""
Lifecycle Stage: DRF Core Endpoints -> Health Check, Auth Identity, Token Blacklist Logout & User Directory
Production Invariant (🔴): Health checks validate live DB connectivity; logout invalidates refresh tokens server-side.
Trap Prevented (⚠️): Client-only logout leaving stolen refresh tokens valid for days; fake 200 health probes.
"""
from typing import Any

from django.contrib.auth import get_user_model
from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "full_name", "is_staff", "is_superuser", "role")

    def get_role(self, obj: Any) -> str:
        if obj.is_superuser:
            return "Admin"
        if obj.is_staff:
            return "Manager"
        return "Requester"

    def get_full_name(self, obj: Any) -> str:
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username


class LogoutRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes: list[Any] = []
    throttle_classes: list[Any] = []

    @extend_schema(responses={200: serializers.DictField()})
    def get(self, request: Request) -> Response:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return Response(
            {
                "status": "healthy",
                "database": "connected",
                "service": "opsdesk-api",
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=UserSummarySerializer)
    def get(self, request: Request) -> Response:
        return Response(UserSummarySerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=LogoutRequestSerializer, responses={205: None})
    def post(self, request: Request) -> Response:
        serializer = LogoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Refresh token is invalid or already blacklisted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class UserDirectoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=UserSummarySerializer(many=True))
    def get(self, request: Request) -> Response:
        users = User.objects.filter(is_active=True).order_by("first_name", "username")
        return Response(UserSummarySerializer(users, many=True).data)
