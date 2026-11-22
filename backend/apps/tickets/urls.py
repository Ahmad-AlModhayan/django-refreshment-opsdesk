from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.tickets.views import DashboardMetricsView, ProjectViewSet, TicketViewSet

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")
router.register("tickets", TicketViewSet, basename="ticket")

urlpatterns = [
    path("dashboard/metrics/", DashboardMetricsView.as_view(), name="dashboard-metrics"),
    path("", include(router.urls)),
]
