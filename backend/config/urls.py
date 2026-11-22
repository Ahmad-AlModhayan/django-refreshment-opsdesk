"""
Lifecycle Stage: HTTP Request Entry -> Root URL Router Dispatch
Production Invariant (🔴): Every API endpoint lives under /api/ so Vite dev proxy and Nginx share identical paths.
Trap Prevented (⚠️): Mismatched /api prefixes between local dev and production reverse proxies causing 404s.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.core.views import CurrentUserView, HealthCheckView, LogoutView, UserDirectoryView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Infrastructure & OpenAPI documentation
    path("api/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-docs"),
    # JWT Auth lifecycle
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("api/auth/me/", CurrentUserView.as_view(), name="auth-me"),
    path("api/users/", UserDirectoryView.as_view(), name="user-directory"),
    # Domain modules
    path("api/", include("apps.tickets.urls")),
    path("api/", include("apps.audit.urls")),
]
