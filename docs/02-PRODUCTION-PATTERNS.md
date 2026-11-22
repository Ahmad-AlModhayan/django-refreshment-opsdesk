# 02 — Production Patterns (`🔴` Failure → Defense Chains)

> Every pattern below exists in this repository to defeat a real workplace failure mode. Open the linked file to see the exact live implementation.

---

## 1. Django ORM & Concurrency

### 🔴 N+1 Foreign-Key Query Storm
- **Failure:** Accessing `ticket.project.code`, `ticket.author.username`, and `ticket.assignee.username` inside a serializer without eager loading fires $1 + 3N$ SQL queries.
- **File:** `backend/apps/tickets/views.py` (`TicketViewSet.get_queryset`, `ProjectViewSet.get_queryset`)

```python
# ✗ Broken
queryset = Ticket.objects.all()

# ✓ Production-Safe (2 SQL queries for 20 rows)
queryset = Ticket.objects.select_related("project", "author", "assignee")
```
> **⚠️ Trap:** Using `select_related` on a reverse many-to-one relation (`audit_logs`) raises a `FieldError`. Use `select_related` for single-valued FKs (SQL `JOIN`), and `prefetch_related` for reverse/many relations (2nd `WHERE IN` query).

---

### 🔴 Concurrent Double-Transition Race Condition
- **Failure:** Two approvers click **Approve** and **Reject** within the same millisecond. Both read `status = "awaiting_approval"` and commit conflicting transitions.
- **File:** `backend/apps/tickets/views.py` (`TicketViewSet.transition`) & `backend/apps/tickets/models.py` (`Ticket.transition_to`)

```python
# ✗ Broken — Read-Modify-Write race window
ticket = Ticket.objects.get(pk=pk)
ticket.transition_to(new_status, request.user)

# ✓ Production-Safe — Row lock on tickets row only (PostgreSQL-safe with nullable assignee)
with transaction.atomic():
    ticket = get_object_or_404(
        Ticket.objects.select_for_update(of=("self",)).select_related("project", "author", "assignee"),
        pk=pk,
    )
    self.check_object_permissions(request, ticket)
    ticket.transition_to(new_status, actor=request.user, note=note)
```
> **⚠️ Trap:** Two real PostgreSQL traps: (1) `select_for_update()` MUST run inside `transaction.atomic()` or Django raises `TransactionManagementError`; (2) combining `select_for_update()` with `select_related("assignee")` (where `assignee` is `null=True`) emits a `LEFT OUTER JOIN` and PostgreSQL rejects it with `NotSupportedError: FOR UPDATE cannot be applied to the nullable side of an outer join` unless you pass `of=("self",)`. SQLite treats `select_for_update()` as a no-op locally, which is why PostgreSQL CI is mandatory.

---

### 🔴 Partial Mutation Without Audit Atomicity
- **Failure:** `ticket.save()` succeeds, then `AuditLog.objects.create()` crashes due to a DB timeout — leaving an undocumented state change.
- **File:** `backend/apps/tickets/models.py` (`Ticket.transition_to`) & `backend/apps/tickets/tests.py` (`test_audit_log_atomicity_rolls_back_ticket_status_on_failure`)

```python
# ✗ Broken (Django autocommits each statement)
self.status = new_status
self.save()
AuditLog.objects.create(...)

# ✓ Production-Safe
with transaction.atomic():
    self.status = new_status
    self.save(update_fields=["status", "updated_at"])
    AuditLog.objects.create(...)
```

---

### 🔴 Dashboard Aggregation & Unbounded CSV OOM
- **Failure:** Running 8 separate `.count()` queries slows dashboards and skews numbers; assembling a 100k-row CSV in a Python string crashes Gunicorn workers.
- **File:** `backend/apps/tickets/views.py` (`DashboardMetricsView`, `TicketViewSet.export`)
- **Defense:** Single `Ticket.objects.aggregate(Count(..., filter=Q(...)), Sum(Case(When(...))))` for KPIs, and `StreamingHttpResponse` + `queryset.iterator(chunk_size=200)` for CSV exports.

---

## 2. DRF Security & RBAC

### 🔴 Mass Assignment of `status` and `author`
- **Failure:** Reusing a single `ModelSerializer` lets a malicious client POST `{"status": "approved", "author": 1}`.
- **File:** `backend/apps/tickets/serializers.py` (`TicketReadSerializer` vs `TicketWriteSerializer`)

```python
# ✗ Broken
class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = "__all__"

# ✓ Production-Safe
class TicketWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ("project", "title", "description", "priority", "assignee")
```

---

### 🔴 IDOR Bypass Inside Custom `@action` Handlers
- **Failure:** DRF only calls `has_object_permission()` inside `self.get_object()`. Fetching a locked row manually via `get_object_or_404(Ticket.objects.select_for_update(), pk=pk)` silently skips object permissions!
- **File:** `backend/apps/tickets/views.py` (`TicketViewSet.transition`) & `backend/apps/core/permissions.py` (`IsAuthorOrStaff`)
- **Defense:** Always call `self.check_object_permissions(request, ticket)` immediately after loading the locked row. Verified by `test_idor_blocked_for_non_author_standard_user`.

---

## 3. JWT Auth & Single-Flight React Refresh

### 🔴 Parallel `401` Refresh Storm Under Token Rotation
- **Failure:** `ROTATE_REFRESH_TOKENS=True` + `BLACKLIST_AFTER_ROTATION=True` means a refresh token can only be used **once**. If a screen fires 3 parallel API calls right as the access token expires, all 3 get `401`. If all 3 call `/api/auth/token/refresh/`, request #1 succeeds and blacklists the old token; requests #2 and #3 get `401` and wipe the user's session!
- **File:** `frontend/src/api/client.ts`

```ts
// ✗ Broken — fires N concurrent refreshes and trips the blacklist
if (error.response?.status === 401) {
  const access = await refreshAccessToken();
  return apiClient(originalRequest);
}

// ✓ Production-Safe — Single-Flight Promise Lock + _retry guard
if (isUnauthorized && originalRequest && !originalRequest._retry) {
  originalRequest._retry = true;
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  const freshAccess = await refreshPromise;
  originalRequest.headers.Authorization = `Bearer ${freshAccess}`;
  return apiClient(originalRequest);
}
```
> **⚠️ Trap:** Without the `_retry` flag, if a backend endpoint returns `401` even with a fresh token (e.g., revoked user), the interceptor loops infinitely.

---

## 4. React 19 & TanStack Query

### 🔴 `useEffect` Fetch Race Conditions & Pagination Flicker
- **Failure:** Typing `"INFRA"` then `"SEC"` fires two fetches; if `"INFRA"` resolves second, it overwrites the `"SEC"` table.
- **File:** `frontend/src/features/tickets/useTickets.ts`
- **Defense:** Parameterized `queryKey: ["tickets", params]` + `placeholderData: keepPreviousData`. TanStack Query discards stale responses automatically and keeps the previous page rendered while fetching.

---

## 5. Nginx, WhiteNoise & Docker Hardening

### 🔴 SPA Deep-Route `404` & Proxy TLS Redirect Loops
- **Failure:** Refreshing `http://localhost/tickets` hits Nginx looking for a file named `/tickets` (`404`). Behind HTTPS load balancers, Django thinks requests are HTTP unless `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` is set.
- **Files:** `nginx/default.conf`, `backend/config/settings.py`, `backend/Dockerfile`, `frontend/Dockerfile`
- **Defense:** `try_files $uri $uri/ /index.html;`, `proxy_set_header X-Forwarded-Proto $scheme;`, non-root `appuser`, and `CompressedManifestStaticFilesStorage`.
