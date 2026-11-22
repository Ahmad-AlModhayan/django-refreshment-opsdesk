# OpsDesk — `django-refreshment`

Enterprise-grade IT Operations & Approval Portal built with **Django 6.1 + DRF + PostgreSQL 17 + React 19 + TypeScript + TanStack Query + Tailwind CSS + Nginx**, engineered with an embedded **Study Mode Engineering Inspector** for accelerated production architecture recall.

## Clone Into Any Workspace
```powershell
git clone https://github.com/Ahmad-AlModhayan/django-refreshment-opsdesk.git
cd django-refreshment-opsdesk
```

## Quick Start (Local Development — PowerShell)

### 1. Start Django API (`http://127.0.0.1:8000`)
```powershell
cd D:\projects\django\django-refreshment\backend
.\.venv\Scripts\Activate.ps1
$env:DEBUG="True"
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### 2. Start React SPA (`http://localhost:5173`)
```powershell
cd D:\projects\django\django-refreshment\frontend
npm run dev
```

### 3. Production Stack via Docker Compose (`http://localhost`)
```powershell
cd D:\projects\django\django-refreshment
docker compose up --build
```

## Demo Credentials (`seed_demo`)
| Role | Username | Password | Permissions |
| --- | --- | --- | --- |
| **Admin** | `admin` | `AdminPassword123!` | Superuser — full edits & approvals |
| **Manager** | `manager` | `ManagerPassword123!` | Staff — global triage & transitions |
| **Requester** | `requester` | `RequesterPassword123!` | Standard — own tickets only (`403` IDOR protection) |

## Study Pack (`docs/`)
- [01-ARCHITECTURE-MAP.md](docs/01-ARCHITECTURE-MAP.md) — Vocabulary, query math ($1+3N$ vs $2$), Gunicorn formula, full request trace.
- [02-PRODUCTION-PATTERNS.md](docs/02-PRODUCTION-PATTERNS.md) — Every `🔴` Failure → Defense chain with exact repo file pointers.
- [03-DRILLS-AND-RUNBOOK.md](docs/03-DRILLS-AND-RUNBOOK.md) — Folded `<details>` bug drills, PowerShell runbook, and new-feature recipe.
