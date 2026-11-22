"""
Lifecycle Stage: Domain Persistence -> Immutable Compliance Audit Trail
Production Invariant (🔴): Every ticket mutation writes an AuditLog inside the same transaction.atomic() block.
Trap Prevented (⚠️): Partial writes where a ticket changes status but the audit entry fails or is omitted.
"""
from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        TRANSITIONED = "transitioned", "Status Transitioned"

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="audit_logs",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=32, choices=Action.choices)
    from_status = models.CharField(max_length=32, blank=True, default="")
    to_status = models.CharField(max_length=32, blank=True, default="")
    note = models.CharField(max_length=280, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["ticket", "-created_at"]),
            models.Index(fields=["action", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.ticket_id} {self.action} by {self.actor_id}"
