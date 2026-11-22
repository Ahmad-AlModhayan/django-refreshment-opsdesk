"""
Lifecycle Stage: DRF Read-Only Endpoint -> Global Audit Trail Feed
Production Invariant (🔴): Always uses select_related('ticket', 'ticket__project', 'actor') for constant-query pages.
Trap Prevented (⚠️): Exposing mutable endpoints on an append-only compliance log or triggering N+1 joins.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogFeedSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogFeedSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["action", "ticket", "actor"]
    search_fields = ["ticket__reference_code", "ticket__title", "note", "actor__username"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at", "-id"]

    def get_queryset(self):
        return AuditLog.objects.select_related("ticket", "ticket__project", "actor")
