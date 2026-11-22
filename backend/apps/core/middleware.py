"""
Lifecycle Stage: WSGI Middleware -> SQL & Latency Response Telemetry
Production Invariant (🔴): Counts executed SQL queries via execute_wrapper even when DEBUG=False.
Trap Prevented (⚠️): Relying on connection.queries (always empty when DEBUG=False) or silently shipping N+1 queries.
"""
import time
from typing import Any, Callable

from django.conf import settings
from django.db import connection
from django.http import HttpRequest, HttpResponse


class _QueryCounter:
    def __init__(self) -> None:
        self.count = 0

    def __call__(
        self,
        execute: Callable[..., Any],
        sql: str,
        params: Any,
        many: bool,
        context: dict[str, Any],
    ) -> Any:
        self.count += 1
        return execute(sql, params, many, context)


class StudyTelemetryMiddleware:
    """Attaches X-DB-Query-Count and X-Response-Time-Ms when Study Telemetry or DEBUG is active."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if not (settings.DEBUG or getattr(settings, "ENABLE_STUDY_TELEMETRY", False)):
            return self.get_response(request)

        counter = _QueryCounter()
        start = time.perf_counter()
        with connection.execute_wrapper(counter):
            response = self.get_response(request)

        elapsed_ms = (time.perf_counter() - start) * 1000
        response["X-DB-Query-Count"] = str(counter.count)
        response["X-Response-Time-Ms"] = f"{elapsed_ms:.2f}"
        return response
