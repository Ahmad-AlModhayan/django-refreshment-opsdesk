"""
Lifecycle Stage: DRF Serialization -> Read-Only Audit Log Representation
Production Invariant (🔴): Serializes actor and ticket identifiers from pre-joined relations with zero extra queries.
Trap Prevented (⚠️): Calling actor.username on an unjoined queryset and triggering 1 + 2N queries per page.
"""
from rest_framework import serializers

from apps.audit.models import AuditLog
from apps.core.views import UserSummarySerializer


class AuditLogEntrySerializer(serializers.ModelSerializer):
    """Compact serializer embedded inside TicketReadSerializer."""

    actor = UserSummarySerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = ("id", "action", "from_status", "to_status", "note", "actor", "created_at")


class AuditLogFeedSerializer(serializers.ModelSerializer):
    """Global audit feed serializer with ticket metadata included."""

    actor = UserSummarySerializer(read_only=True)
    ticket_id = serializers.IntegerField(source="ticket.id", read_only=True)
    ticket_reference = serializers.CharField(source="ticket.reference_code", read_only=True)
    ticket_title = serializers.CharField(source="ticket.title", read_only=True)
    project_code = serializers.CharField(source="ticket.project.code", read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "ticket_id",
            "ticket_reference",
            "ticket_title",
            "project_code",
            "action",
            "from_status",
            "to_status",
            "note",
            "actor",
            "created_at",
        )
