"""
Lifecycle Stage: Domain Persistence -> Project & Ticket Models + State Machine
Production Invariant (🔴): Status transitions only occur through transition_to() and record an AuditLog atomically.
Trap Prevented (⚠️): Illegal state jumps (e.g. open -> closed directly) or CASCADE deleting user/project history.
"""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction

from apps.core.models import TimeStampedModel

if TYPE_CHECKING:
    from apps.audit.models import AuditLog


class Project(TimeStampedModel):
    code = models.CharField(max_length=16, unique=True)
    name = models.CharField(max_length=120)
    department = models.CharField(max_length=80)
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class Ticket(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In Progress"
        AWAITING_APPROVAL = "awaiting_approval", "Awaiting Approval"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    ALLOWED_TRANSITIONS: dict[str, list[str]] = {
        Status.OPEN: [Status.IN_PROGRESS, Status.AWAITING_APPROVAL, Status.REJECTED],
        Status.IN_PROGRESS: [Status.AWAITING_APPROVAL, Status.RESOLVED, Status.OPEN],
        Status.AWAITING_APPROVAL: [Status.APPROVED, Status.REJECTED, Status.IN_PROGRESS],
        Status.APPROVED: [Status.IN_PROGRESS, Status.RESOLVED],
        Status.REJECTED: [Status.OPEN, Status.CLOSED],
        Status.RESOLVED: [Status.CLOSED, Status.IN_PROGRESS],
        Status.CLOSED: [Status.OPEN],
    }

    reference_code = models.CharField(max_length=24, unique=True, blank=True)
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="tickets",
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(
        max_length=24,
        choices=Status.choices,
        default=Status.OPEN,
    )
    priority = models.CharField(
        max_length=16,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="authored_tickets",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["project", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.reference_code}: {self.title}"

    @property
    def allowed_transitions(self) -> list[str]:
        return list(self.ALLOWED_TRANSITIONS.get(self.status, []))

    def save(self, *args, **kwargs) -> None:
        is_new = self._state.adding
        needs_code = is_new and not self.reference_code
        if needs_code:
            self.reference_code = f"TMP-{uuid.uuid4().hex[:12]}"
        super().save(*args, **kwargs)
        if needs_code:
            generated = f"{self.project.code}-{1000 + self.pk}"
            Ticket.objects.filter(pk=self.pk).update(reference_code=generated)
            self.reference_code = generated

    def transition_to(self, new_status: str, actor, note: str = "") -> AuditLog:
        """Validates and executes a state-machine transition with an atomic AuditLog write."""
        from apps.audit.models import AuditLog

        allowed = self.ALLOWED_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValidationError(
                {
                    "to_status": (
                        f"Cannot transition from '{self.status}' to '{new_status}'. "
                        f"Allowed next states: {', '.join(allowed) or 'none'}."
                    )
                }
            )

        previous_status = self.status
        with transaction.atomic():
            self.status = new_status
            self.save(update_fields=["status", "updated_at"])
            audit_entry = AuditLog.objects.create(
                ticket=self,
                actor=actor,
                action=AuditLog.Action.TRANSITIONED,
                from_status=previous_status,
                to_status=new_status,
                note=note.strip(),
            )
        return audit_entry
