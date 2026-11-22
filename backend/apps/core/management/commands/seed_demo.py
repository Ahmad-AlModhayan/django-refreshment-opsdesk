"""
Lifecycle Stage: CLI Seeding -> Idempotent Enterprise Demo Dataset Loader
Production Invariant (🔴): Safe to execute repeatedly without duplicating users, projects, tickets, or audit logs.
Trap Prevented (⚠️): Non-idempotent seed scripts crashing on second run or polluting databases on container restarts.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.audit.models import AuditLog
from apps.tickets.models import Project, Ticket

User = get_user_model()

DEMO_USERS = [
    {
        "username": "admin",
        "email": "admin@opsdesk.internal",
        "first_name": "Elena",
        "last_name": "Vance",
        "password": "AdminPassword123!",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "username": "manager",
        "email": "manager@opsdesk.internal",
        "first_name": "Marcus",
        "last_name": "Chen",
        "password": "ManagerPassword123!",
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "username": "requester",
        "email": "requester@opsdesk.internal",
        "first_name": "Priya",
        "last_name": "Nair",
        "password": "RequesterPassword123!",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "username": "sre.lead",
        "email": "sre@opsdesk.internal",
        "first_name": "Daniel",
        "last_name": "Kowalski",
        "password": "RequesterPassword123!",
        "is_staff": False,
        "is_superuser": False,
    },
]

DEMO_PROJECTS = [
    {
        "code": "INFRA",
        "name": "Cloud Infrastructure",
        "department": "Platform Engineering",
        "description": "Kubernetes clusters, VPC peering, Terraform drift remediation, and multi-region failover.",
    },
    {
        "code": "SEC",
        "name": "Security & IAM",
        "department": "Information Security",
        "description": "Zero-trust access approvals, hardware token rotation, SOC2 evidence, and KMS policies.",
    },
    {
        "code": "DATA",
        "name": "Data Platform",
        "department": "Data Engineering",
        "description": "PostgreSQL read-replica scaling, warehouse PII masking, and CDC pipeline governance.",
    },
    {
        "code": "FINOPS",
        "name": "Enterprise FinOps",
        "department": "IT Governance",
        "description": "Production spend approvals, reserved instance commitments, and vendor SaaS renewals.",
    },
]

# 36 realistic enterprise IT ops & approval requests covering every state and priority
SEED_TICKETS = [
    ("INFRA", "Production PostgreSQL 17 connection pool exhaustion on eu-west-1", "critical", "awaiting_approval", "requester", "admin", ["open", "in_progress", "awaiting_approval"]),
    ("SEC", "Emergency AWS KMS key policy update for payment tokenization service", "critical", "in_progress", "manager", "admin", ["open", "in_progress"]),
    ("INFRA", "Upgrade Nginx ingress controller to mitigate HTTP/2 rapid reset CVE", "critical", "open", "sre.lead", "manager", ["open"]),
    ("DATA", "Approve read-replica failover promotion for analytics primary", "critical", "awaiting_approval", "requester", "manager", ["open", "awaiting_approval"]),
    ("SEC", "Revoke legacy service-account tokens across CI/CD runners", "high", "approved", "admin", "manager", ["open", "awaiting_approval", "approved"]),
    ("INFRA", "Provision isolated staging VPC for Q4 disaster recovery drill", "high", "in_progress", "requester", "sre.lead", ["open", "in_progress"]),
    ("FINOPS", "Annual Datadog APM commitment renewal ($184k capex approval)", "high", "awaiting_approval", "manager", "admin", ["open", "awaiting_approval"]),
    ("DATA", "Enable row-level PII masking on customer billing warehouse tables", "high", "resolved", "sre.lead", "admin", ["open", "in_progress", "resolved"]),
    ("SEC", "Enforce hardware FIDO2 MFA for all production break-glass admins", "critical", "approved", "admin", "admin", ["open", "awaiting_approval", "approved"]),
    ("INFRA", "Migrate Gunicorn worker pool sizing formula to 2C + 1 on API nodes", "medium", "resolved", "sre.lead", "manager", ["open", "in_progress", "resolved"]),
    ("DATA", "Backfill partition indexes on ledger_events_2026 without table lock", "high", "in_progress", "requester", "sre.lead", ["open", "in_progress"]),
    ("FINOPS", "Approve 3-year Compute Savings Plan for production EKS nodes", "medium", "awaiting_approval", "requester", "admin", ["open", "awaiting_approval"]),
    ("SEC", "Quarterly SOC2 Type II access review export for core repositories", "medium", "closed", "manager", "admin", ["open", "in_progress", "resolved", "closed"]),
    ("INFRA", "Configure HSTS preload and TLS 1.3 cipher suite on edge gateway", "high", "approved", "admin", "sre.lead", ["open", "awaiting_approval", "approved"]),
    ("DATA", "Investigate slow reporting query missing composite (status, priority) index", "high", "open", "requester", "manager", ["open"]),
    ("FINOPS", "Decommission idle GPU training cluster in us-east-2 sandbox", "low", "resolved", "manager", "sre.lead", ["open", "in_progress", "resolved"]),
    ("SEC", "Exception request: temporary SSH bastion access for vendor audit", "high", "rejected", "requester", "admin", ["open", "awaiting_approval", "rejected"]),
    ("INFRA", "Automate zero-downtime Django migration verification in GitHub Actions", "medium", "closed", "sre.lead", "manager", ["open", "in_progress", "resolved", "closed"]),
    ("DATA", "Create dedicated analytics role with read-only schema grants", "low", "open", "requester", None, ["open"]),
    ("FINOPS", "Approve GitHub Enterprise seat expansion (+25 engineering licenses)", "medium", "approved", "manager", "admin", ["open", "awaiting_approval", "approved"]),
    ("SEC", "Rotate JWT signing secret across regional secret managers", "critical", "open", "admin", "admin", ["open"]),
    ("INFRA", "Enable WhiteNoise Brotli manifest compression for admin static assets", "low", "closed", "sre.lead", "sre.lead", ["open", "in_progress", "resolved", "closed"]),
    ("DATA", "Stream nightly compliance CSV snapshots to immutable S3 archive", "medium", "in_progress", "requester", "manager", ["open", "in_progress"]),
    ("FINOPS", "Audit orphaned EBS gp3 volumes across non-production accounts", "low", "open", "requester", None, ["open"]),
    ("SEC", "Approve Okta SAML attribute mapping for contractor onboarding", "medium", "awaiting_approval", "requester", "admin", ["open", "awaiting_approval"]),
    ("INFRA", "Configure PgBouncer transaction pooling for bursty webhook traffic", "high", "awaiting_approval", "sre.lead", "admin", ["open", "in_progress", "awaiting_approval"]),
    ("DATA", "Upgrade dbt Core runner image to Python 3.13 slim base", "low", "resolved", "sre.lead", "sre.lead", ["open", "in_progress", "resolved"]),
    ("FINOPS", "Reject duplicate SaaS observability trial procurement request", "low", "rejected", "requester", "manager", ["open", "rejected"]),
    ("SEC", "Deploy CSP Level 3 headers across internal portal reverse proxy", "medium", "in_progress", "manager", "admin", ["open", "in_progress"]),
    ("INFRA", "Increase Redis Sentinel quorum timeout for multi-AZ maintenance", "high", "open", "sre.lead", "manager", ["open"]),
    ("DATA", "Add automated vacuum-analyze monitoring alerts on audit_log table", "medium", "approved", "admin", "sre.lead", ["open", "awaiting_approval", "approved"]),
    ("FINOPS", "Cost allocation tagging enforcement via AWS Organizations SCP", "medium", "in_progress", "manager", "admin", ["open", "in_progress"]),
    ("SEC", "Approve external penetration test scope for OpsDesk REST API", "high", "awaiting_approval", "admin", "admin", ["open", "awaiting_approval"]),
    ("INFRA", "Replace legacy CronJob backup script with verified pg_basebackup", "high", "resolved", "sre.lead", "admin", ["open", "in_progress", "resolved"]),
    ("DATA", "Consolidate duplicate ETL staging schemas before Q1 freeze", "low", "closed", "requester", "manager", ["open", "in_progress", "resolved", "closed"]),
    ("FINOPS", "Approve Cloudflare Enterprise WAF rate-limiting add-on", "high", "open", "manager", None, ["open"]),
]


class Command(BaseCommand):
    help = "Idempotently seed enterprise users, projects, tickets, and audit logs for OpsDesk."

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        users: dict[str, User] = {}
        for spec in DEMO_USERS:
            user, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={
                    "email": spec["email"],
                    "first_name": spec["first_name"],
                    "last_name": spec["last_name"],
                    "is_staff": spec["is_staff"],
                    "is_superuser": spec["is_superuser"],
                },
            )
            if created:
                user.set_password(spec["password"])
                user.save()
            users[spec["username"]] = user

        projects: dict[str, Project] = {}
        for spec in DEMO_PROJECTS:
            project, _ = Project.objects.update_or_create(
                code=spec["code"],
                defaults={
                    "name": spec["name"],
                    "department": spec["department"],
                    "description": spec["description"],
                },
            )
            projects[spec["code"]] = project

        now = timezone.now()
        created_tickets = 0

        for idx, (proj_code, title, priority, target_status, author_key, assignee_key, trail) in enumerate(SEED_TICKETS, start=1):
            ref_code = f"{proj_code}-{1000 + idx}"
            if Ticket.objects.filter(reference_code=ref_code).exists():
                continue

            project = projects[proj_code]
            author = users[author_key]
            assignee = users[assignee_key] if assignee_key else None
            base_time = now - timedelta(hours=(len(SEED_TICKETS) - idx) * 6 + 2)

            ticket = Ticket.objects.create(
                reference_code=ref_code,
                project=project,
                title=title,
                description=(
                    f"Operational change and governance tracking for {project.name} ({project.department}). "
                    f"Includes automated rollback verification, SLA impact tracking, and immutable approval audit trail."
                ),
                status=target_status,
                priority=priority,
                author=author,
                assignee=assignee,
            )
            Ticket.objects.filter(pk=ticket.pk).update(created_at=base_time, updated_at=base_time + timedelta(hours=2))

            created_log = AuditLog.objects.create(
                ticket=ticket,
                actor=author,
                action=AuditLog.Action.CREATED,
                from_status="",
                to_status=Ticket.Status.OPEN,
                note=f"Ticket opened under {project.code} with {priority} priority.",
            )
            AuditLog.objects.filter(pk=created_log.pk).update(created_at=base_time)

            for step_i in range(len(trail) - 1):
                from_st = trail[step_i]
                to_st = trail[step_i + 1]
                actor = assignee or users["admin"]
                step_time = base_time + timedelta(minutes=(step_i + 1) * 45)
                log = AuditLog.objects.create(
                    ticket=ticket,
                    actor=actor,
                    action=AuditLog.Action.TRANSITIONED,
                    from_status=from_st,
                    to_status=to_st,
                    note=f"Workflow progressed from {from_st.replace('_', ' ')} to {to_st.replace('_', ' ')}.",
                )
                AuditLog.objects.filter(pk=log.pk).update(created_at=step_time)

            created_tickets += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {len(users)} users, {len(projects)} projects, "
                f"{created_tickets} newly created tickets ({Ticket.objects.count()} total)."
            )
        )
