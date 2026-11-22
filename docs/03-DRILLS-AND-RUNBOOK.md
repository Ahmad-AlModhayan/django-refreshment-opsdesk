# 03 — Active Recall Drills & Operations Runbook

> **Rule of Use:** Answer each drill out loud or on paper *before* opening the `<details>` block.

---

## 1. "Spot the Production Bug" Drills

### Drill 1 — The Hidden Query Multiplier
A junior engineer adds a `ticket_count` field to `ProjectSerializer`:
```python
class ProjectSerializer(serializers.ModelSerializer):
    ticket_count = serializers.SerializerMethodField()
    def get_ticket_count(self, obj):
        return obj.tickets.count()
```
What happens when OpsDesk grows to 50 projects, and how is it solved in `backend/apps/tickets/views.py`?

<details>
<summary>Reveal Answer</summary>

It fires **51 SQL queries** ($1 + 50$) per page load. In `ProjectViewSet.get_queryset()`, we use `Project.objects.annotate(ticket_count=Count("tickets", distinct=True))`, keeping it at **1 SQL query** forever — locked in by `test_zero_n_plus_one_on_projects_directory`.
</details>

---

### Drill 2 — The Custom `@action` Security Hole
You write `POST /api/tickets/{id}/transition/` using `Ticket.objects.select_for_update().get(pk=pk)`. Your `TicketViewSet` already declares `permission_classes = [IsAuthenticated, IsAuthorOrStaff]`. Why can User B still transition User A's ticket?

<details>
<summary>Reveal Answer</summary>

DRF only executes `has_object_permission()` automatically inside `self.get_object()`. Because you bypassed `self.get_object()` to attach `select_for_update()`, you MUST explicitly call `self.check_object_permissions(request, ticket)`.
</details>

---

### Drill 3 — The Random Logout Mystery
After turning on `ROTATE_REFRESH_TOKENS=True` and `BLACKLIST_AFTER_ROTATION=True`, users get randomly logged out whenever they open the Dashboard after 15 minutes of inactivity. Why?

<details>
<summary>Reveal Answer</summary>

The Dashboard fires `/dashboard/metrics/` and `/projects/` simultaneously. Both get `401`. Without a single-flight `refreshPromise` lock in `frontend/src/api/client.ts`, both POST the same refresh token; the first succeeds and blacklists it, and the second fails with `401`, triggering `clearTokens()` and logging the user out.
</details>

---

### Drill 4 — The Disappearing Telemetry Counter
Your `StudyTelemetryMiddleware` works locally (`DEBUG=True`), showing `2 SQL queries`, but shows `0` in staging (`DEBUG=False`). Why?

<details>
<summary>Reveal Answer</summary>

Using `len(connection.queries)` returns `0` whenever `DEBUG=False` because Django stops buffering SQL strings in memory. Using `connection.execute_wrapper(counter)` (as in `backend/apps/core/middleware.py`) counts every executed cursor statement cleanly even when `DEBUG=False`.
</details>

---

### Drill 5 — The Missing Production Migration
You add a composite index to `Ticket.Meta.indexes` and push straight to production without running `makemigrations`. What catches this before deployment?

<details>
<summary>Reveal Answer</summary>

The CI gate `python manage.py makemigrations --check --dry-run` in `.github/workflows/ci.yml` exits non-zero whenever model definitions drift from committed migration files.
</details>

---

## 2. Active-Recall Mastery Checklist

Before considering a concept mastered, verify you can explain it from memory:
- [ ] Explain why `Ticket.project` uses `PROTECT` while `Ticket.assignee` uses `SET_NULL`.
- [ ] Trace all 5 hops of `GET /api/tickets/` and state why it executes **2** SQL queries instead of **62**.
- [ ] Explain why `TicketReadSerializer` and `TicketWriteSerializer` are split.
- [ ] Explain how `refreshPromise ??= ...` prevents token-blacklist collisions.
- [ ] Explain why `nginx/default.conf` needs both `proxy_set_header X-Forwarded-Proto $scheme` and `try_files $uri $uri/ /index.html`.

---

## 3. PowerShell Local Development Runbook

### Backend Setup & Verification
```powershell
cd D:\projects\django\django-refreshment\backend
.\.venv\Scripts\Activate.ps1

# System check & production deploy security audit
$env:DEBUG="True"
python manage.py check
$env:DEBUG="False"; python manage.py check --deploy; $env:DEBUG="True"

# Migration drift check (same command as CI)
python manage.py makemigrations --check --dry-run

# Apply migrations & idempotently seed demo data
python manage.py migrate
python manage.py seed_demo

# Run full test suite (includes assertNumQueries & RBAC tests)
python manage.py test -v 2

# Open interactive DB shell
python manage.py dbshell

# Start Django dev server on http://127.0.0.1:8000
python manage.py runserver
```

### Frontend Setup & Verification
```powershell
cd D:\projects\django\django-refreshment\frontend
npm install
npx tsc --noEmit
npm run build
npm run dev   # http://localhost:5173 (proxies /api -> 127.0.0.1:8000)
```

### Full-Stack Docker Compose (PostgreSQL 17 + Gunicorn + Nginx)
```powershell
cd D:\projects\django\django-refreshment
Copy-Item .env.example .env -ErrorAction SilentlyContinue
docker compose config
docker compose up --build
# Open http://localhost (Nginx serves React SPA + proxies /api to Gunicorn)
```

---

## 4. End-to-End Recipe: Adding a New Feature (e.g., `TicketComment`)

1. **Model (`backend/apps/tickets/models.py`):** Inherit `TimeStampedModel`, add `ticket = ForeignKey(Ticket, on_delete=CASCADE, related_name="comments")`, `author = ForeignKey(User, on_delete=PROTECT)`, add `Meta.indexes = [Index(fields=["ticket", "created_at"])]`.
2. **Migration:** Run `python manage.py makemigrations` and `python manage.py migrate`.
3. **Split Serializers (`backend/apps/tickets/serializers.py`):** Create `CommentReadSerializer` (nested `author`) and `CommentWriteSerializer` (`fields = ("body",)` only — set `author=request.user` in view).
4. **View & Query Discipline (`backend/apps/tickets/views.py`):** Use `select_related("author")` on list, wrap create in `transaction.atomic()` if writing an `AuditLog`, enforce `IsAuthorOrStaff` on edits/deletes.
5. **Regression Tests (`backend/apps/tickets/tests.py`):** Add `assertNumQueries`, mass-assignment rejection, and IDOR `403` tests.
6. **Frontend Contract (`frontend/src/types/api.ts` & `src/api/`):** Add TypeScript interface and Axios helper using relative `/api/...`.
7. **Server State (`frontend/src/features/`):** Create TanStack Query hook (`useQuery` + `useMutation` invalidating the query key) and wire form with React 19 `useActionState`.
8. **Verify:** Run `python manage.py test`, `npx tsc --noEmit`, and `npm run build`.
