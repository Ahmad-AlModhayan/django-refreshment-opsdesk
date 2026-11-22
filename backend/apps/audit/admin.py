from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "action", "from_status", "to_status", "actor", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("ticket__reference_code", "actor__username", "note")
    readonly_fields = ("ticket", "actor", "action", "from_status", "to_status", "note", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
