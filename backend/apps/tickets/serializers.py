"""
Lifecycle Stage: DRF Serialization -> Split Read vs Write Contracts
Production Invariant (🔴): TicketWriteSerializer never accepts author or status, eliminating mass assignment.
Trap Prevented (⚠️): Reusing a single ModelSerializer for reads & writes and letting attackers forge status='approved'.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.audit.serializers import AuditLogEntrySerializer
from apps.core.views import UserSummarySerializer
from apps.tickets.models import Project, Ticket

User = get_user_model()


class ProjectSerializer(serializers.ModelSerializer):
    ticket_count = serializers.IntegerField(read_only=True, default=0)
    open_ticket_count = serializers.IntegerField(read_only=True, default=0)
    critical_ticket_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Project
        fields = (
            "id",
            "code",
            "name",
            "department",
            "description",
            "ticket_count",
            "open_ticket_count",
            "critical_ticket_count",
            "created_at",
            "updated_at",
        )


class ProjectCompactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "code", "name", "department")


class TicketListSerializer(serializers.ModelSerializer):
    """High-density list serializer backed by select_related (2 SQL queries total per page)."""

    project = ProjectCompactSerializer(read_only=True)
    author = UserSummarySerializer(read_only=True)
    assignee = UserSummarySerializer(read_only=True)
    allowed_transitions = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )

    class Meta:
        model = Ticket
        fields = (
            "id",
            "reference_code",
            "project",
            "title",
            "description",
            "status",
            "priority",
            "author",
            "assignee",
            "allowed_transitions",
            "created_at",
            "updated_at",
        )


class TicketReadSerializer(TicketListSerializer):
    """Detail serializer including prefetched immutable audit trail."""

    audit_logs = AuditLogEntrySerializer(many=True, read_only=True)

    class Meta(TicketListSerializer.Meta):
        fields = TicketListSerializer.Meta.fields + ("audit_logs",)


class TicketWriteSerializer(serializers.ModelSerializer):
    """Restricted write contract: author is set from request.user; status is controlled exclusively by transition_to."""

    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Ticket
        fields = ("project", "title", "description", "priority", "assignee")


class TicketTransitionSerializer(serializers.Serializer):
    to_status = serializers.ChoiceField(choices=Ticket.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="", max_length=280)
