/**
 * Lifecycle Stage: Embedded Learning System -> Route-Synced Architecture Traces, Failure Chains & Recall Drills
 * Production Invariant (🔴): Every trace path, code snippet, and SQL claim maps 1:1 to real files in this repository.
 * Trap Prevented (⚠️): Generic textbook tips disconnected from the running application's actual implementation.
 */
import type { StudyScreenKey } from "./StudyModeContext";

export interface TraceStep {
  step: number;
  layer: string;
  filePath: string;
  summary: string;
}

export interface FailureDefenseChain {
  title: string;
  failure: string;
  brokenCode: string;
  safeCode: string;
  fileRef: string;
}

export interface AcronymTrap {
  term: string;
  expansion: string;
  trap: string;
}

export interface RecallDrill {
  question: string;
  hint: string;
  answer: string;
}

export interface StudyModule {
  screenTitle: string;
  endpointFocus: string;
  expectedQueries: string;
  naiveComparison: string;
  trace: TraceStep[];
  chains: FailureDefenseChain[];
  acronymsAndTraps: AcronymTrap[];
  drills: RecallDrill[];
}

export const STUDY_MODULES: Record<StudyScreenKey, StudyModule> = {
  dashboard: {
    screenTitle: "Executive Dashboard",
    endpointFocus: "GET /api/dashboard/metrics/",
    expectedQueries: "2 SQL queries (1 aggregate + 1 joined feed)",
    naiveComparison: "vs 9+ separate COUNT(*) queries or downloading N rows into JS",
    trace: [
      {
        step: 1,
        layer: "React Page",
        filePath: "frontend/src/features/dashboard/DashboardPage.tsx",
        summary: "Calls useDashboardMetrics() and renders KPI cards, priority distribution, and recent audit activity.",
      },
      {
        step: 2,
        layer: "TanStack Query Hook",
        filePath: "frontend/src/features/dashboard/useDashboard.ts",
        summary: "Caches metrics under ['dashboard', 'metrics']; automatically refreshes after any ticket mutation.",
      },
      {
        step: 3,
        layer: "Axios + Proxy Parity",
        filePath: "frontend/src/api/client.ts -> nginx/default.conf",
        summary: "Sends relative GET /api/dashboard/metrics/ with Bearer JWT and captures X-DB-Query-Count header.",
      },
      {
        step: 4,
        layer: "DRF View & ORM Aggregate",
        filePath: "backend/apps/tickets/views.py (DashboardMetricsView)",
        summary: "Runs a single Ticket.objects.aggregate(Count(..., filter=Q(...)), Sum(Case(When(...)))) SQL query.",
      },
      {
        step: 5,
        layer: "Middleware & PostgreSQL",
        filePath: "backend/apps/core/middleware.py",
        summary: "StudyTelemetryMiddleware wraps connection.execute_wrapper to count exact SQL statements.",
      },
    ],
    chains: [
      {
        title: "Multiple COUNT Queries vs Single-Query Conditional Aggregation",
        failure:
          "Issuing separate .filter(status=...).count() calls per KPI card multiplies DB round-trips and yields inconsistent snapshots under concurrent writes.",
        brokenCode: `open_n = Ticket.objects.filter(status="open").count()
in_prog = Ticket.objects.filter(status="in_progress").count()
critical = Ticket.objects.filter(priority="critical").count()
# 8 separate SQL round-trips + skewed snapshot`,
        safeCode: `Ticket.objects.aggregate(
    open_count=Count("id", filter=Q(status="open")),
    in_progress=Count("id", filter=Q(status="in_progress")),
    critical_sla=Count("id", filter=Q(priority="critical") & ~Q(status__in=closed)),
) # 1 single SQL SELECT with FILTER (WHERE ...)`,
        fileRef: "backend/apps/tickets/views.py",
      },
      {
        title: "Telemetry Blindness When DEBUG=False",
        failure:
          "Reading len(connection.queries) returns 0 in production/staging because Django disables query logging when DEBUG=False.",
        brokenCode: `# Silently returns 0 when DEBUG=False!
response["X-DB-Query-Count"] = str(len(connection.queries))`,
        safeCode: `with connection.execute_wrapper(counter):
    response = self.get_response(request)
response["X-DB-Query-Count"] = str(counter.count)`,
        fileRef: "backend/apps/core/middleware.py",
      },
    ],
    acronymsAndTraps: [
      {
        term: "ORM",
        expansion: "Object-Relational Mapper (Django's SQL compiler)",
        trap: "Calling len(qs) instead of qs.count() loads every full row into Python RAM just to count them.",
      },
      {
        term: "KPI / SLA",
        expansion: "Key Performance Indicator / Service Level Agreement",
        trap: "Computing SLA sums in JavaScript over a paginated API response only counts the first 20 rows!",
      },
      {
        term: "CORS",
        expansion: "Cross-Origin Resource Sharing",
        trap: "Custom headers like X-DB-Query-Count are hidden from browser JS unless listed in CORS_EXPOSE_HEADERS.",
      },
    ],
    drills: [
      {
        question: "Spot the Bug: A teammate replaces DashboardMetricsView's aggregate() with 7 separate .count() calls. What breaks under load?",
        hint: "Think about DB round-trips AND consistency across concurrent ticket transitions.",
        answer:
          "It turns 1 SQL query into 7 round-trips (7x connection latency) AND KPI totals can disagree with each other if a ticket transitions between query #1 and query #4.",
      },
      {
        question: "Why does StudyTelemetryMiddleware use connection.execute_wrapper() instead of connection.queries?",
        hint: "Check what Django does to connection.queries when DEBUG=False.",
        answer:
          "Django only records SQL strings in connection.queries when DEBUG=True. execute_wrapper() intercepts cursor execution regardless of DEBUG, keeping memory overhead O(1).",
      },
    ],
  },

  tickets: {
    screenTitle: "Ticket & Approval Workspace",
    endpointFocus: "GET /api/tickets/ & POST /api/tickets/{id}/transition/",
    expectedQueries: "2 SQL queries on list (COUNT + JOIN); 2 SQL queries on detail",
    naiveComparison: "vs 1 + 3N = 61 SQL queries per 20-row page without select_related",
    trace: [
      {
        step: 1,
        layer: "Workspace Table & Drawer",
        filePath: "frontend/src/features/tickets/TicketWorkspacePage.tsx",
        summary: "Manages URL/filter state with debounced search, opens TicketDrawer on row click, triggers CSV download.",
      },
      {
        step: 2,
        layer: "Server-State Cache",
        filePath: "frontend/src/features/tickets/useTickets.ts",
        summary: "Uses parameterized queryKey ['tickets', params] + placeholderData: keepPreviousData to eliminate table flicker.",
      },
      {
        step: 3,
        layer: "Single-Flight Auth Client",
        filePath: "frontend/src/api/client.ts",
        summary: "Attaches Bearer JWT; if access token expires mid-session, shares one refreshPromise across parallel 401s.",
      },
      {
        step: 4,
        layer: "DRF ViewSet + Filters + Lock",
        filePath: "backend/apps/tickets/views.py (TicketViewSet)",
        summary: "Applies TicketFilter SQL WHERE clauses, select_related('project', 'author', 'assignee'), and select_for_update() on transitions.",
      },
      {
        step: 5,
        layer: "State Machine & Atomic Audit",
        filePath: "backend/apps/tickets/models.py (Ticket.transition_to)",
        summary: "Validates ALLOWED_TRANSITIONS and writes Ticket.status + AuditLog inside a single transaction.atomic() block.",
      },
    ],
    chains: [
      {
        title: "N+1 Query Explosion on Foreign Keys",
        failure:
          "Serializing project, author, and assignee on 20 rows without select_related fires 1 + 3×20 = 61 queries per page load.",
        brokenCode: `queryset = Ticket.objects.all()
# Serializing 20 rows -> 1 + 60 extra SELECTs!`,
        safeCode: `queryset = Ticket.objects.select_related(
    "project", "author", "assignee"
) # 1 COUNT(*) + 1 SQL JOIN = 2 queries total`,
        fileRef: "backend/apps/tickets/views.py",
      },
      {
        title: "Concurrent Double-Transition Race Condition",
        failure:
          "Two managers click Approve/Reject simultaneously; both read status='awaiting_approval' and overwrite each other without a row lock.",
        brokenCode: `ticket = Ticket.objects.get(pk=pk)
ticket.transition_to(new_status, request.user)
# Classic Read-Modify-Write race window`,
        safeCode: `with transaction.atomic():
    ticket = get_object_or_404(
        Ticket.objects.select_for_update(of=("self",))
        .select_related("project", "author", "assignee"),
        pk=pk,
    )
    self.check_object_permissions(request, ticket)
    ticket.transition_to(new_status, request.user)`,
        fileRef: "backend/apps/tickets/views.py",
      },
      {
        title: "Mass Assignment & Custom @action IDOR Bypass",
        failure:
          "Exposing status/author in a write serializer lets users forge status='approved'; forgetting check_object_permissions() in @action lets any user transition any ticket.",
        brokenCode: `class TicketSerializer(ModelSerializer):
    class Meta:
        fields = "__all__" # Attacker sends status="approved"!`,
        safeCode: `class TicketWriteSerializer(ModelSerializer):
    class Meta:
        fields = ("project", "title", "description", "priority", "assignee")
# author=request.user on server; status only via transition_to()`,
        fileRef: "backend/apps/tickets/serializers.py",
      },
      {
        title: "Parallel 401 Refresh Storm vs Single-Flight Lock",
        failure:
          "When 3 simultaneous requests receive 401 and all POST /auth/token/refresh/, call #1 rotates & blacklists the token, causing calls #2 and #3 to fail and log the user out.",
        brokenCode: `if (err.response?.status === 401) {
  const { access } = await refreshToken(); // Runs 3x in parallel!
}`,
        safeCode: `refreshPromise ??= refreshAccessToken().finally(() => {
  refreshPromise = null;
});
const freshAccess = await refreshPromise; // All 401s await 1 call`,
        fileRef: "frontend/src/api/client.ts",
      },
    ],
    acronymsAndTraps: [
      {
        term: "IDOR",
        expansion: "Insecure Direct Object Reference",
        trap: "DRF's ModelViewSet only runs has_object_permission() inside get_object(). Custom @action handlers using select_for_update() MUST call self.check_object_permissions(request, obj).",
      },
      {
        term: "JWT",
        expansion: "JSON Web Token (Stateless Bearer Auth + Blacklisted Refresh)",
        trap: "Enabling ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION without a frontend single-flight lock causes random logouts.",
      },
      {
        term: "RBAC",
        expansion: "Role-Based Access Control",
        trap: "Hiding the Edit button in React is UX only — real authorization MUST live on the Django server (IsAuthorOrStaff).",
      },
      {
        term: "CSV Streaming",
        expansion: "StreamingHttpResponse + queryset.iterator(chunk_size=200)",
        trap: "Building a giant CSV string in memory crashes Gunicorn workers with OOM on large exports.",
      },
    ],
    drills: [
      {
        question: "Spot the Bug: In TicketViewSet.transition(), we replaced self.get_object() with Ticket.objects.select_for_update().get(pk=pk). What security hole just opened?",
        hint: "Where does DRF invoke permission.has_object_permission()?",
        answer:
          "IDOR! Because self.get_object() was bypassed, IsAuthorOrStaff.has_object_permission() will NOT run unless you explicitly call self.check_object_permissions(request, ticket).",
      },
      {
        question: "Why does TicketWorkspacePage use TanStack Query's keepPreviousData instead of a manual useEffect fetch?",
        hint: "Think about race conditions when typing fast in search AND page-switch table flash.",
        answer:
          "Manual useEffect fetches suffer from out-of-order response races (an older slow query overwriting a newer fast query) and flash empty skeletons on every page click. TanStack Query cancels/ignores stale keys and keeps previous rows visible while fetching.",
      },
      {
        question: "Why does TicketViewSet.transition() call select_for_update(of=('self',)) instead of bare select_for_update()?",
        hint: "Look at the nullable assignee FK joined via select_related('assignee') on PostgreSQL.",
        answer:
          "Because assignee has null=True, Django emits a LEFT OUTER JOIN. PostgreSQL rejects FOR UPDATE on the nullable side of an outer join with NotSupportedError unless you scope the row lock to tickets using of=('self',). SQLite ignores FOR UPDATE locally, which is why PostgreSQL CI catches this trap.",
      },
    ],
  },

  projects: {
    screenTitle: "Projects & RBAC Directory",
    endpointFocus: "GET /api/projects/",
    expectedQueries: "1 SQL query (annotated GROUP BY)",
    naiveComparison: "vs 1 + 3P = 13 queries for 4 projects using serializer method .count()",
    trace: [
      {
        step: 1,
        layer: "Directory Page",
        filePath: "frontend/src/features/projects/ProjectsPage.tsx",
        summary: "Displays project health cards with live total, active, and critical ticket counters + drill-down links.",
      },
      {
        step: 2,
        layer: "Query Hook",
        filePath: "frontend/src/features/projects/useProjects.ts",
        summary: "Shares ['projects'] cache across ProjectsPage, Ticket filters, and CreateTicketModal.",
      },
      {
        step: 3,
        layer: "API Service",
        filePath: "frontend/src/api/projects.ts",
        summary: "Issues GET /api/projects/ through the shared Axios client.",
      },
      {
        step: 4,
        layer: "Annotated ViewSet",
        filePath: "backend/apps/tickets/views.py (ProjectViewSet)",
        summary: "Annotates ticket_count, open_ticket_count, and critical_ticket_count with Count(..., distinct=True).",
      },
      {
        step: 5,
        layer: "Database Schema",
        filePath: "backend/apps/tickets/models.py (Project & Ticket)",
        summary: "Ticket.project uses on_delete=models.PROTECT so deleting a project cannot silently wipe ticket history.",
      },
    ],
    chains: [
      {
        title: "SerializerMethodField N+1 vs ORM annotate(Count(...))",
        failure:
          "Computing project.tickets.count() inside a SerializerMethodField triggers 1 SQL query per project per counter.",
        brokenCode: `def get_ticket_count(self, obj):
    return obj.tickets.count() # Fires N extra SQL queries!`,
        safeCode: `Project.objects.annotate(
    ticket_count=Count("tickets", distinct=True),
    open_ticket_count=Count("tickets", filter=Q(...), distinct=True),
) # 1 single SQL LEFT OUTER JOIN + GROUP BY`,
        fileRef: "backend/apps/tickets/views.py",
      },
      {
        title: "Accidental Data Loss with on_delete=CASCADE",
        failure:
          "Using on_delete=models.CASCADE on Ticket.project or Ticket.author silently deletes thousands of compliance records if a project or employee is removed.",
        brokenCode: `project = models.ForeignKey(Project, on_delete=models.CASCADE)`,
        safeCode: `project = models.ForeignKey(Project, on_delete=models.PROTECT)
assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)`,
        fileRef: "backend/apps/tickets/models.py",
      },
    ],
    acronymsAndTraps: [
      {
        term: "GROUP BY / distinct=True",
        expansion: "SQL Aggregation Deduplication",
        trap: "Combining multiple Count() annotations across different joins without distinct=True causes Cartesian product inflation.",
      },
      {
        term: "FK / PROTECT",
        expansion: "Foreign Key Referential Integrity Constraint",
        trap: "Defaulting every ForeignKey to CASCADE is a classic production disaster on financial or audit tables.",
      },
    ],
    drills: [
      {
        question: "Why does Ticket.assignee use on_delete=models.SET_NULL while Ticket.author uses on_delete=models.PROTECT?",
        hint: "Think about what happens when an engineer leaves the company vs who owns the historical request.",
        answer:
          "An assignee is optional — if unassigned/removed, the ticket stays valid with assignee=NULL. Author and Project are mandatory compliance ownership links, so PROTECT prevents accidental orphaned or wiped history.",
      },
      {
        question: "Why did we set pagination_class = None on ProjectViewSet?",
        hint: "Check how many queries /api/projects/ fires and where the list is reused.",
        answer:
          "Project count is small and bounded, and the full list powers both the directory and dropdown filters. Disabling pagination drops the extra COUNT(*) query so /api/projects/ runs in literally 1 SQL query.",
      },
    ],
  },

  audit: {
    screenTitle: "Immutable Audit Log",
    endpointFocus: "GET /api/audit-logs/",
    expectedQueries: "2 SQL queries (COUNT + multi-hop JOIN)",
    naiveComparison: "vs 1 + 3N queries if ticket, project, and actor were fetched lazily",
    trace: [
      {
        step: 1,
        layer: "Audit Log Page",
        filePath: "frontend/src/features/audit/AuditLogPage.tsx",
        summary: "Displays append-only compliance timeline with action filter, search, and server-side pagination.",
      },
      {
        step: 2,
        layer: "TanStack Query Hook",
        filePath: "frontend/src/features/audit/useAuditLogs.ts",
        summary: "Maintains paginated cache keyed by ['audit-logs', params] with smooth page transitions.",
      },
      {
        step: 3,
        layer: "Read-Only ViewSet",
        filePath: "backend/apps/audit/views.py (AuditLogViewSet)",
        summary: "Inherits ReadOnlyModelViewSet so HTTP POST/PATCH/DELETE are structurally impossible via the API.",
      },
      {
        step: 4,
        layer: "Multi-Hop select_related",
        filePath: "backend/apps/audit/views.py",
        summary: "Calls select_related('ticket', 'ticket__project', 'actor') to resolve 3 tables in 1 SQL JOIN.",
      },
      {
        step: 5,
        layer: "Composite Index & Atomicity",
        filePath: "backend/apps/audit/models.py",
        summary: "Indexed on (ticket, -created_at) and (action, -created_at); written strictly inside transaction.atomic().",
      },
    ],
    chains: [
      {
        title: "Partial Mutation Without Atomic Transaction",
        failure:
          "Updating ticket.status outside transaction.atomic() and then crashing on AuditLog.objects.create() leaves an undocumented state change in production.",
        brokenCode: `self.status = new_status
self.save()
AuditLog.objects.create(...) # If this throws, status stays changed!`,
        safeCode: `with transaction.atomic():
    self.status = new_status
    self.save(update_fields=["status", "updated_at"])
    AuditLog.objects.create(...) # All-or-nothing rollback`,
        fileRef: "backend/apps/tickets/models.py",
      },
      {
        title: "Nginx SPA 404 on Deep Route Refresh",
        failure:
          "Refreshing /audit directly in production hits Nginx looking for a file named /usr/share/nginx/html/audit and returns 404 unless try_files falls back to index.html.",
        brokenCode: `location / {
    root /usr/share/nginx/html;
    # Refreshing /audit returns 404 Not Found!
}`,
        safeCode: `location / {
    try_files $uri $uri/ /index.html;
}`,
        fileRef: "nginx/default.conf",
      },
    ],
    acronymsAndTraps: [
      {
        term: "ACID",
        expansion: "Atomicity, Consistency, Isolation, Durability",
        trap: "Django defaults to autocommit per SQL statement unless you wrap multi-table writes in transaction.atomic().",
      },
      {
        term: "SPA",
        expansion: "Single-Page Application (Client-Side Routing)",
        trap: "Always verify hard-refreshing nested routes like /audit or /projects behind Nginx.",
      },
    ],
    drills: [
      {
        question: "How does our test suite verify that AuditLog writes are truly atomic with Ticket transitions?",
        hint: "Check test_audit_log_atomicity_rolls_back_ticket_status_on_failure in apps/tickets/tests.py.",
        answer:
          "It patches AuditLog.objects.create to raise a RuntimeError, calls ticket.transition_to(), then calls ticket.refresh_from_db() to assert ticket.status rolled back to 'open'.",
      },
      {
        question: "Why does AuditLogViewSet use select_related('ticket', 'ticket__project', 'actor') with a double underscore?",
        hint: "Look at AuditLogFeedSerializer.project_code.",
        answer:
          "The serializer traverses ticket.project.code. Without 'ticket__project' in select_related, Django would fire an extra Project SELECT for every single AuditLog row on the page.",
      },
    ],
  },
};
