# 01 — Architecture Map (`django-refreshment` / OpsDesk)

> **Goal:** Understand how every layer connects from browser click to PostgreSQL row lock in under 10 minutes. Keep this open alongside the in-app **Study Mode** drawer.

---

## 1. Abbreviations & Vocabulary Table

| Acronym | Full Name | Role in OpsDesk |
| --- | --- | --- |
| **DRF** | Django REST Framework | Serialization, ViewSets, pagination, throttling, and object RBAC. |
| **ORM** | Object-Relational Mapper | Compiles Python QuerySets (`select_related`, `aggregate`, `select_for_update`) into SQL. |
| **JWT** | JSON Web Token | Stateless `Bearer` access token (15m) + rotating/blacklisted refresh token (7d). |
| **RBAC** | Role-Based Access Control | `IsAuthorOrStaff` enforces read-all, mutate-owned-or-staff on the server. |
| **IDOR** | Insecure Direct Object Reference | Vulnerability where changing `/tickets/42/` to `/tickets/43/` edits someone else's data. |
| **CORS** | Cross-Origin Resource Sharing | Browser policy controlling cross-origin JS requests and exposed headers (`X-DB-Query-Count`). |
| **CSRF** | Cross-Site Request Forgery | Origin protection for cookie-backed sessions (Django Admin) via `CSRF_TRUSTED_ORIGINS`. |
| **WSGI** | Web Server Gateway Interface | Synchronous Python server contract between **Gunicorn** workers and Django. |
| **SPA** | Single-Page Application | React + React Router rendering routes client-side behind Nginx `try_files`. |
| **ACID** | Atomicity, Consistency, Isolation, Durability | Guaranteed by PostgreSQL + `transaction.atomic()` when writing Ticket + AuditLog together. |
| **HSTS** | HTTP Strict Transport Security | Forces browsers to use HTTPS exclusively when `DEBUG=False`. |

---

## 2. Before You Start — Core Production Math

### HTTP Status Codes Used Intentionally Here
- `200 OK` — Read, update, or atomic state transition succeeded.
- `201 Created` — New ticket inserted + initial `AuditLog` committed.
- `205 Reset Content` — `POST /api/auth/logout/` blacklisted the refresh token.
- `400 Bad Request` — Invalid serializer field OR illegal state transition (e.g., `open → closed`).
- `401 Unauthorized` — Missing/expired JWT access token OR replayed blacklisted refresh token.
- `403 Forbidden` — Authenticated user violated object-level RBAC (`IsAuthorOrStaff`).
- `429 Too Many Requests` — DRF throttling exceeded (`60/min` anon, `120/min` authenticated).

### Browser Origin & Dev/Prod Parity
A Browser **Origin** is the exact triple: `scheme + host + port` (e.g., `http://localhost:5173` ≠ `http://127.0.0.1:8000`).
- **In Dev:** `frontend/vite.config.ts` proxies `/api`, `/admin`, and `/static` to `http://127.0.0.1:8000`.
- **In Production:** `nginx/default.conf` proxies `/api`, `/admin`, and `/static` to `http://backend:8000`.
- **Result:** `frontend/src/api/client.ts` always uses relative `baseURL: "/api"`. Zero environment-specific URL hacks.

### Query Complexity Math: $1 + 3N$ vs $2$
On a 20-row Ticket page (`PAGE_SIZE = 20`) where each row displays `project`, `author`, and `assignee`:
- **Naive ORM (`Ticket.objects.all()`):** $1\text{ (COUNT)} + 1\text{ (tickets)} + 3 \times 20\text{ (FK lookups)} = \mathbf{62\text{ SQL queries}}$.
- **Production ORM (`select_related("project", "author", "assignee")`):** $1\text{ (COUNT)} + 1\text{ (LEFT OUTER JOIN)} = \mathbf{2\text{ SQL queries}}$ regardless of $N$.
- Verify live via the `X-DB-Query-Count` header in **Study Mode** or `python manage.py test`.

### Gunicorn Worker Sizing Formula
$$W = 2C + 1$$
Where $C$ is available CPU cores. For a 1-core container, $W = 2(1) + 1 = 3$ workers (`GUNICORN_WORKERS=3` in `docker-compose.yml`). Combined with `CONN_MAX_AGE=60` and `CONN_HEALTH_CHECKS=True`, each worker reuses healthy PostgreSQL connections without exhausting `max_connections`.

---

## 3. Full Request-to-Database Trace

```text
[Browser / React 19]
   │  1. TicketWorkspacePage.tsx -> useTickets(params) [TanStack Query]
   │  2. api/client.ts -> attaches "Authorization: Bearer <access>"
   ▼     + single-flight refreshPromise lock if 401 occurs
[Edge Proxy: Vite Dev Proxy OR Nginx (nginx/default.conf)]
   │  3. Routes /api/* -> backend:8000 with Host & X-Forwarded-Proto
   │     Routes /* -> /index.html (SPA fallback)
   ▼
[Gunicorn WSGI Workers -> Django Middleware (config/settings.py)]
   │  4. SecurityMiddleware -> WhiteNoise -> CorsMiddleware -> Auth -> StudyTelemetryMiddleware
   ▼
[DRF Router & ViewSet (backend/apps/tickets/views.py)]
   │  5. JWTAuthentication validates signature & expiry
   │  6. IsAuthorOrStaff verifies object ownership or staff flag
   │  7. TicketFilter compiles URL params into indexed SQL WHERE clauses
   ▼
[Domain Model & PostgreSQL 17 (backend/apps/tickets/models.py)]
   │  8. select_related / prefetch_related / aggregate() keeps queries O(1)
   │  9. transaction.atomic() + select_for_update() locks row & writes AuditLog
   ▼
[Response Back Up the Stack]
      10. StudyTelemetryMiddleware attaches X-DB-Query-Count & X-Response-Time-Ms
      11. Axios telemetryStore records headers for live Study Inspector display
```
