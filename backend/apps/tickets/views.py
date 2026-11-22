"""
Lifecycle Stage: DRF View Layer -> Ticket CRUD, Concurrency-Safe Transitions, Aggregation & CSV Stream
Production Invariant (🔴): Uses select_related/prefetch_related for O(1) queries and select_for_update() on transitions.
Trap Prevented (⚠️): N+1 query storms, double-transition race conditions, and unbuffered CSV memory spikes.
"""
import csv
from typing import Iterator

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Case, Count, IntegerField, Prefetch, Q, Sum, Value, When
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogFeedSerializer
from apps.core.permissions import IsAuthorOrStaff
from apps.tickets.filters import TicketFilter
from apps.tickets.models import Project, Ticket
from apps.tickets.serializers import (
    ProjectSerializer,
    TicketListSerializer,
    TicketReadSerializer,
    TicketTransitionSerializer,
    TicketWriteSerializer,
)


class _EchoBuffer:
    """File-like write buffer for csv.writer streaming without loading all rows into RAM."""

    def write(self, value: str) -> str:
        return value


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        active_statuses = [
            Ticket.Status.OPEN,
            Ticket.Status.IN_PROGRESS,
            Ticket.Status.AWAITING_APPROVAL,
        ]
        closed_statuses = [Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
        return Project.objects.annotate(
            ticket_count=Count("tickets", distinct=True),
            open_ticket_count=Count(
                "tickets",
                filter=Q(tickets__status__in=active_statuses),
                distinct=True,
            ),
            critical_ticket_count=Count(
                "tickets",
                filter=Q(tickets__priority=Ticket.Priority.CRITICAL)
                & ~Q(tickets__status__in=closed_statuses),
                distinct=True,
            ),
        ).order_by("code")


class TicketViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrStaff]
    filterset_class = TicketFilter
    search_fields = ["reference_code", "title", "description", "project__code", "project__name"]
    ordering_fields = ["created_at", "updated_at", "priority", "status", "reference_code"]
    ordering = ["-created_at", "-id"]

    def get_queryset(self):
        queryset = Ticket.objects.select_related("project", "author", "assignee")
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                Prefetch(
                    "audit_logs",
                    queryset=AuditLog.objects.select_related("actor").order_by("-created_at", "-id"),
                )
            )
        return queryset

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return TicketWriteSerializer
        if self.action == "list":
            return TicketListSerializer
        return TicketReadSerializer

    @extend_schema(request=TicketWriteSerializer, responses={201: TicketReadSerializer})
    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = TicketWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            ticket = serializer.save(author=request.user)
            AuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action=AuditLog.Action.CREATED,
                from_status="",
                to_status=ticket.status,
                note=f"Created in {ticket.project.code} with {ticket.priority} priority.",
            )
        hydrated = self.get_detail_queryset().get(pk=ticket.pk)
        return Response(TicketReadSerializer(hydrated).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=TicketWriteSerializer, responses={200: TicketReadSerializer})
    def update(self, request: Request, *args, **kwargs) -> Response:
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = TicketWriteSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        changed_fields = [
            field
            for field, val in serializer.validated_data.items()
            if getattr(instance, field) != val
        ]
        with transaction.atomic():
            ticket = serializer.save()
            AuditLog.objects.create(
                ticket=ticket,
                actor=request.user,
                action=AuditLog.Action.UPDATED,
                from_status=ticket.status,
                to_status=ticket.status,
                note=(
                    f"Updated fields: {', '.join(changed_fields)}."
                    if changed_fields
                    else "Metadata saved without field changes."
                ),
            )
        hydrated = self.get_detail_queryset().get(pk=ticket.pk)
        return Response(TicketReadSerializer(hydrated).data, status=status.HTTP_200_OK)

    def get_detail_queryset(self):
        return Ticket.objects.select_related("project", "author", "assignee").prefetch_related(
            Prefetch(
                "audit_logs",
                queryset=AuditLog.objects.select_related("actor").order_by("-created_at", "-id"),
            )
        )

    @extend_schema(request=TicketTransitionSerializer, responses={200: TicketReadSerializer})
    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request: Request, pk: str | None = None) -> Response:
        serializer = TicketTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # of=("self",) locks only the tickets row so PostgreSQL allows LEFT OUTER JOIN on nullable assignee
            ticket = get_object_or_404(
                Ticket.objects.select_for_update(of=("self",)).select_related("project", "author", "assignee"),
                pk=pk,
            )
            # Custom @action bypasses get_object(), so explicit object RBAC check is mandatory
            self.check_object_permissions(request, ticket)
            try:
                ticket.transition_to(
                    new_status=serializer.validated_data["to_status"],
                    actor=request.user,
                    note=serializer.validated_data.get("note", ""),
                )
            except DjangoValidationError as exc:
                raise DRFValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)

        hydrated = self.get_detail_queryset().get(pk=ticket.pk)
        return Response(TicketReadSerializer(hydrated).data, status=status.HTTP_200_OK)

    @extend_schema(responses={200: bytes})
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request: Request) -> StreamingHttpResponse:
        queryset = self.filter_queryset(self.get_queryset())
        writer = csv.writer(_EchoBuffer())

        def row_stream() -> Iterator[str]:
            yield writer.writerow(
                [
                    "Reference",
                    "Project",
                    "Title",
                    "Status",
                    "Priority",
                    "Author",
                    "Assignee",
                    "Created At (UTC)",
                    "Updated At (UTC)",
                ]
            )
            for ticket in queryset.iterator(chunk_size=200):
                yield writer.writerow(
                    [
                        ticket.reference_code,
                        ticket.project.code,
                        ticket.title,
                        ticket.get_status_display(),
                        ticket.get_priority_display(),
                        ticket.author.username,
                        ticket.assignee.username if ticket.assignee else "Unassigned",
                        ticket.created_at.isoformat(),
                        ticket.updated_at.isoformat(),
                    ]
                )

        response = StreamingHttpResponse(row_stream(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="opsdesk-tickets.csv"'
        return response


class DashboardKPIsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    open = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    awaiting_approval = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    resolved = serializers.IntegerField()
    closed = serializers.IntegerField()
    critical_sla = serializers.IntegerField()
    sla_pressure_score = serializers.IntegerField()


class DashboardPriorityBreakdownSerializer(serializers.Serializer):
    low = serializers.IntegerField()
    medium = serializers.IntegerField()
    high = serializers.IntegerField()
    critical = serializers.IntegerField()


class DashboardMetricsResponseSerializer(serializers.Serializer):
    kpis = DashboardKPIsSerializer()
    by_priority = DashboardPriorityBreakdownSerializer()
    recent_activity = AuditLogFeedSerializer(many=True)


class DashboardMetricsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: DashboardMetricsResponseSerializer})
    def get(self, request: Request) -> Response:
        closed_statuses = [Ticket.Status.RESOLVED, Ticket.Status.CLOSED]

        # Single SQL aggregation computes every KPI, priority bucket, and SLA risk score at once
        agg = Ticket.objects.aggregate(
            total=Count("id"),
            open_count=Count("id", filter=Q(status=Ticket.Status.OPEN)),
            in_progress_count=Count("id", filter=Q(status=Ticket.Status.IN_PROGRESS)),
            awaiting_approval_count=Count("id", filter=Q(status=Ticket.Status.AWAITING_APPROVAL)),
            approved_count=Count("id", filter=Q(status=Ticket.Status.APPROVED)),
            rejected_count=Count("id", filter=Q(status=Ticket.Status.REJECTED)),
            resolved_count=Count("id", filter=Q(status=Ticket.Status.RESOLVED)),
            closed_count=Count("id", filter=Q(status=Ticket.Status.CLOSED)),
            critical_sla_count=Count(
                "id",
                filter=Q(priority=Ticket.Priority.CRITICAL) & ~Q(status__in=closed_statuses),
            ),
            priority_low=Count("id", filter=Q(priority=Ticket.Priority.LOW)),
            priority_medium=Count("id", filter=Q(priority=Ticket.Priority.MEDIUM)),
            priority_high=Count("id", filter=Q(priority=Ticket.Priority.HIGH)),
            priority_critical=Count("id", filter=Q(priority=Ticket.Priority.CRITICAL)),
            sla_pressure_score=Sum(
                Case(
                    When(status__in=closed_statuses, then=Value(0)),
                    When(priority=Ticket.Priority.CRITICAL, then=Value(5)),
                    When(priority=Ticket.Priority.HIGH, then=Value(3)),
                    When(priority=Ticket.Priority.MEDIUM, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            ),
        )

        recent_logs = AuditLog.objects.select_related(
            "ticket", "ticket__project", "actor"
        ).order_by("-created_at", "-id")[:8]

        return Response(
            {
                "kpis": {
                    "total": agg["total"] or 0,
                    "open": agg["open_count"] or 0,
                    "in_progress": agg["in_progress_count"] or 0,
                    "awaiting_approval": agg["awaiting_approval_count"] or 0,
                    "approved": agg["approved_count"] or 0,
                    "rejected": agg["rejected_count"] or 0,
                    "resolved": agg["resolved_count"] or 0,
                    "closed": agg["closed_count"] or 0,
                    "critical_sla": agg["critical_sla_count"] or 0,
                    "sla_pressure_score": agg["sla_pressure_score"] or 0,
                },
                "by_priority": {
                    "low": agg["priority_low"] or 0,
                    "medium": agg["priority_medium"] or 0,
                    "high": agg["priority_high"] or 0,
                    "critical": agg["priority_critical"] or 0,
                },
                "recent_activity": AuditLogFeedSerializer(recent_logs, many=True).data,
            }
        )
