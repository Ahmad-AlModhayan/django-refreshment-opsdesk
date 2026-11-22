"""
Lifecycle Stage: DRF Query Filtering -> Multi-Facet Server-Side FilterSet
Production Invariant (🔴): Filters push predicates into SQL WHERE clauses backed by composite indexes.
Trap Prevented (⚠️): Loading all rows into Python memory or relying on client-side array.filter() over partial pages.
"""
import django_filters

from apps.tickets.models import Ticket


class TicketFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(method="filter_status")
    priority = django_filters.CharFilter(method="filter_priority")
    project = django_filters.NumberFilter(field_name="project_id")
    project_code = django_filters.CharFilter(field_name="project__code", lookup_expr="iexact")
    assignee = django_filters.NumberFilter(field_name="assignee_id")
    unassigned = django_filters.BooleanFilter(field_name="assignee", lookup_expr="isnull")

    class Meta:
        model = Ticket
        fields = ["status", "priority", "project", "project_code", "assignee", "unassigned"]

    def filter_status(self, queryset, name: str, value: str):
        values = [item.strip() for item in value.split(",") if item.strip()]
        if len(values) == 1:
            return queryset.filter(status=values[0])
        return queryset.filter(status__in=values)

    def filter_priority(self, queryset, name: str, value: str):
        values = [item.strip() for item in value.split(",") if item.strip()]
        if len(values) == 1:
            return queryset.filter(priority=values[0])
        return queryset.filter(priority__in=values)
