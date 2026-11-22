from django.contrib import admin

from apps.tickets.models import Project, Ticket


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "department", "created_at")
    search_fields = ("code", "name", "department")


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("reference_code", "title", "project", "status", "priority", "author", "assignee", "updated_at")
    list_filter = ("status", "priority", "project")
    search_fields = ("reference_code", "title", "description")
    list_select_related = ("project", "author", "assignee")
