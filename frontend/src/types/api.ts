/**
 * Lifecycle Stage: Frontend Type Boundary -> Strongly Typed API Contracts
 * Production Invariant (🔴): Mirrors DRF serializers 1:1 under TypeScript strict mode to catch contract drift at build time.
 * Trap Prevented (⚠️): Untyped `any` payloads silently breaking nested property access in production UI.
 */

export type TicketStatus =
  | "open"
  | "in_progress"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type AuditAction = "created" | "updated" | "transitioned";

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  role: "Admin" | "Manager" | "Requester";
}

export interface ProjectSummary {
  id: number;
  code: string;
  name: string;
  department: string;
}

export interface Project extends ProjectSummary {
  description: string;
  ticket_count: number;
  open_ticket_count: number;
  critical_ticket_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: number;
  action: AuditAction;
  from_status: string;
  to_status: string;
  note: string;
  actor: UserSummary;
  created_at: string;
}

export interface AuditLogFeedItem extends AuditLogEntry {
  ticket_id: number;
  ticket_reference: string;
  ticket_title: string;
  project_code: string;
}

export interface Ticket {
  id: number;
  reference_code: string;
  project: ProjectSummary;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  author: UserSummary;
  assignee: UserSummary | null;
  allowed_transitions: TicketStatus[];
  created_at: string;
  updated_at: string;
}

export interface TicketDetail extends Ticket {
  audit_logs: AuditLogEntry[];
}

export interface TicketWritePayload {
  project: number;
  title: string;
  description: string;
  priority: TicketPriority;
  assignee: number | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardMetrics {
  kpis: {
    total: number;
    open: number;
    in_progress: number;
    awaiting_approval: number;
    approved: number;
    rejected: number;
    resolved: number;
    closed: number;
    critical_sla: number;
    sla_pressure_score: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recent_activity: AuditLogFeedItem[];
}

export interface TelemetryRecord {
  id: string;
  method: string;
  url: string;
  status: number;
  queryCount: number | null;
  responseTimeMs: number | null;
  timestamp: string;
  ok: boolean;
}
