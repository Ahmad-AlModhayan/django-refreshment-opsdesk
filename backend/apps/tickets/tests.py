"""
Lifecycle Stage: Automated Verification -> Query Count, Security, Concurrency & Auth Regression Suite
Production Invariant (🔴): Proves O(1) SQL queries, RBAC/IDOR isolation, mass-assignment rejection, and atomic rollbacks.
Trap Prevented (⚠️): Silent N+1 regressions, accidental serializer over-exposure, or broken JWT rotation in CI.
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.audit.models import AuditLog
from apps.tickets.models import Project, Ticket

User = get_user_model()


class OpsDeskAPITestSuite(APITestCase):
    def setUp(self) -> None:
        self.admin = User.objects.create_user(
            username="admin_test",
            email="admin@test.local",
            password="StrongPassword123!",
            first_name="Elena",
            last_name="Vance",
            is_staff=True,
            is_superuser=True,
        )
        self.requester = User.objects.create_user(
            username="req_test",
            email="req@test.local",
            password="StrongPassword123!",
            first_name="Priya",
            last_name="Nair",
            is_staff=False,
        )
        self.other_user = User.objects.create_user(
            username="other_test",
            email="other@test.local",
            password="StrongPassword123!",
            first_name="Sam",
            last_name="Lee",
            is_staff=False,
        )

        self.infra = Project.objects.create(code="INFRA", name="Cloud Infrastructure", department="Platform")
        self.sec = Project.objects.create(code="SEC", name="Security & IAM", department="InfoSec")

        self.ticket = Ticket.objects.create(
            project=self.infra,
            title="Primary ticket for security and workflow tests",
            description="Detailed operational ticket description.",
            priority=Ticket.Priority.CRITICAL,
            author=self.requester,
            assignee=self.admin,
        )
        AuditLog.objects.create(
            ticket=self.ticket,
            actor=self.requester,
            action=AuditLog.Action.CREATED,
            from_status="",
            to_status=Ticket.Status.OPEN,
            note="Initial creation",
        )

        # Create 12 additional tickets across projects & users to expose any N+1 query bugs
        for i in range(12):
            proj = self.infra if i % 2 == 0 else self.sec
            t = Ticket.objects.create(
                project=proj,
                title=f"Bulk operational request #{i}",
                description="Ensures list, project, and dashboard endpoints remain O(1).",
                priority=Ticket.Priority.HIGH if i % 3 == 0 else Ticket.Priority.MEDIUM,
                status=Ticket.Status.IN_PROGRESS if i % 2 == 0 else Ticket.Status.AWAITING_APPROVAL,
                author=self.requester if i % 2 == 0 else self.other_user,
                assignee=self.admin if i % 3 == 0 else None,
            )
            AuditLog.objects.create(
                ticket=t,
                actor=t.author,
                action=AuditLog.Action.CREATED,
                from_status="",
                to_status=t.status,
                note=f"Seeded audit log #{i}",
            )

    def test_zero_n_plus_one_on_ticket_list(self) -> None:
        self.client.force_authenticate(user=self.admin)
        # 1 COUNT(*) for DRF pagination + 1 SELECT ... JOIN project/author/assignee
        with self.assertNumQueries(2):
            response = self.client.get("/api/tickets/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 13)

    def test_zero_n_plus_one_on_ticket_detail(self) -> None:
        # Add multiple audit logs to verify prefetch_related keeps detail at constant queries
        for idx in range(4):
            AuditLog.objects.create(
                ticket=self.ticket,
                actor=self.admin if idx % 2 == 0 else self.requester,
                action=AuditLog.Action.UPDATED,
                from_status=self.ticket.status,
                to_status=self.ticket.status,
                note=f"Follow-up audit #{idx}",
            )
        self.client.force_authenticate(user=self.admin)
        # 1 SELECT ticket JOIN project/author/assignee + 1 prefetch audit_logs JOIN actor
        with self.assertNumQueries(2):
            response = self.client.get(f"/api/tickets/{self.ticket.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["audit_logs"]), 5)

    def test_zero_n_plus_one_on_projects_directory(self) -> None:
        self.client.force_authenticate(user=self.requester)
        # Single annotated GROUP BY query
        with self.assertNumQueries(1):
            response = self.client.get("/api/projects/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        counts = {p["code"]: p["ticket_count"] for p in response.data}
        self.assertEqual(counts["INFRA"], 7)
        self.assertEqual(counts["SEC"], 6)

    def test_zero_n_plus_one_on_dashboard_metrics(self) -> None:
        self.client.force_authenticate(user=self.admin)
        # 1 single-query ORM aggregate + 1 joined recent_activity query
        with self.assertNumQueries(2):
            response = self.client.get("/api/dashboard/metrics/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["kpis"]["total"], 13)
        self.assertEqual(response.data["kpis"]["critical_sla"], 1)

    def test_mass_assignment_rejected_on_create_and_patch(self) -> None:
        self.client.force_authenticate(user=self.requester)
        payload = {
            "project": self.infra.id,
            "title": "Attempt status & author spoofing",
            "description": "Attacker tries to forge approved status and admin author.",
            "priority": Ticket.Priority.HIGH,
            "status": Ticket.Status.APPROVED,
            "author": self.admin.id,
        }
        create_res = self.client.post("/api/tickets/", payload, format="json")
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data["status"], Ticket.Status.OPEN)
        self.assertEqual(create_res.data["author"]["id"], self.requester.id)

        ticket_id = create_res.data["id"]
        patch_res = self.client.patch(
            f"/api/tickets/{ticket_id}/",
            {"status": Ticket.Status.CLOSED, "author": self.admin.id, "title": "Legitimate edit"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["status"], Ticket.Status.OPEN)
        self.assertEqual(patch_res.data["author"]["id"], self.requester.id)
        self.assertEqual(patch_res.data["title"], "Legitimate edit")

    def test_idor_blocked_for_non_author_standard_user(self) -> None:
        self.client.force_authenticate(user=self.other_user)

        # Read is permitted
        read_res = self.client.get(f"/api/tickets/{self.ticket.id}/")
        self.assertEqual(read_res.status_code, status.HTTP_200_OK)

        # Edit, delete, and custom transition action must all be blocked with 403
        patch_res = self.client.patch(
            f"/api/tickets/{self.ticket.id}/", {"title": "Hijacked title"}, format="json"
        )
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)

        delete_res = self.client.delete(f"/api/tickets/{self.ticket.id}/")
        self.assertEqual(delete_res.status_code, status.HTTP_403_FORBIDDEN)

        transition_res = self.client.post(
            f"/api/tickets/{self.ticket.id}/transition/",
            {"to_status": Ticket.Status.IN_PROGRESS},
            format="json",
        )
        self.assertEqual(transition_res.status_code, status.HTTP_403_FORBIDDEN)

        # Staff user is permitted to transition another user's ticket
        self.client.force_authenticate(user=self.admin)
        staff_res = self.client.post(
            f"/api/tickets/{self.ticket.id}/transition/",
            {"to_status": Ticket.Status.AWAITING_APPROVAL, "note": "Escalated by admin"},
            format="json",
        )
        self.assertEqual(staff_res.status_code, status.HTTP_200_OK)
        self.assertEqual(staff_res.data["status"], Ticket.Status.AWAITING_APPROVAL)

    def test_invalid_transition_rejected_without_audit_entry(self) -> None:
        self.client.force_authenticate(user=self.requester)
        initial_logs = AuditLog.objects.filter(ticket=self.ticket).count()

        res = self.client.post(
            f"/api/tickets/{self.ticket.id}/transition/",
            {"to_status": Ticket.Status.CLOSED},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, Ticket.Status.OPEN)
        self.assertEqual(AuditLog.objects.filter(ticket=self.ticket).count(), initial_logs)

    def test_audit_log_atomicity_rolls_back_ticket_status_on_failure(self) -> None:
        self.client.force_authenticate(user=self.admin)
        with patch("apps.audit.models.AuditLog.objects.create", side_effect=RuntimeError("Simulated audit write crash")):
            with self.assertRaises(RuntimeError):
                self.ticket.transition_to(Ticket.Status.IN_PROGRESS, actor=self.admin)

        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, Ticket.Status.OPEN)

    def test_jwt_rotation_and_blacklisting_and_logout(self) -> None:
        obtain_res = self.client.post(
            reverse("token-obtain-pair"),
            {"username": "req_test", "password": "StrongPassword123!"},
            format="json",
        )
        self.assertEqual(obtain_res.status_code, status.HTTP_200_OK)
        first_refresh = obtain_res.data["refresh"]

        # Refresh rotates refresh token and blacklists the old one
        refresh_res = self.client.post(
            reverse("token-refresh"),
            {"refresh": first_refresh},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        second_refresh = refresh_res.data["refresh"]
        second_access = refresh_res.data["access"]
        self.assertNotEqual(first_refresh, second_refresh)

        # Replaying rotated token must be rejected
        replay_res = self.client.post(
            reverse("token-refresh"),
            {"refresh": first_refresh},
            format="json",
        )
        self.assertEqual(replay_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Logout blacklists the current refresh token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {second_access}")
        logout_res = self.client.post(
            reverse("auth-logout"),
            {"refresh": second_refresh},
            format="json",
        )
        self.assertEqual(logout_res.status_code, status.HTTP_205_RESET_CONTENT)

        after_logout_res = self.client.post(
            reverse("token-refresh"),
            {"refresh": second_refresh},
            format="json",
        )
        self.assertEqual(after_logout_res.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(ENABLE_STUDY_TELEMETRY=True)
    def test_telemetry_headers_csv_export_and_health(self) -> None:
        health = self.client.get("/api/health/")
        self.assertEqual(health.status_code, status.HTTP_200_OK)
        self.assertEqual(health.data["database"], "connected")

        self.client.force_authenticate(user=self.admin)
        list_res = self.client.get("/api/tickets/")
        self.assertIn("X-DB-Query-Count", list_res)
        self.assertIn("X-Response-Time-Ms", list_res)
        self.assertEqual(list_res["X-DB-Query-Count"], "2")

        csv_res = self.client.get("/api/tickets/export/")
        self.assertEqual(csv_res.status_code, status.HTTP_200_OK)
        self.assertIn("text/csv", csv_res["Content-Type"])
        body = b"".join(csv_res.streaming_content).decode("utf-8")
        self.assertIn("Reference,Project,Title,Status,Priority", body)
        self.assertIn(self.ticket.reference_code, body)
