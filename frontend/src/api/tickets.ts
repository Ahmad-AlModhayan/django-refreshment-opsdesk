/**
 * Lifecycle Stage: API Service -> Tickets CRUD, Workflow Transitions & Streaming CSV Export
 * Production Invariant (🔴): Passes filter/search/ordering params directly to Django SQL rather than filtering in JS.
 * Trap Prevented (⚠️): Incomplete client-side filtering over a single paginated slice of tickets.
 */
import type {
  PaginatedResponse,
  Ticket,
  TicketDetail,
  TicketStatus,
  TicketWritePayload,
} from "../types/api";
import { apiClient } from "./client";

export interface TicketQueryParams {
  page?: number;
  status?: string;
  priority?: string;
  project?: string;
  assignee?: string;
  search?: string;
  ordering?: string;
}

export async function fetchTickets(params: TicketQueryParams): Promise<PaginatedResponse<Ticket>> {
  const { data } = await apiClient.get<PaginatedResponse<Ticket>>("/tickets/", { params });
  return data;
}

export async function fetchTicketDetail(id: number): Promise<TicketDetail> {
  const { data } = await apiClient.get<TicketDetail>(`/tickets/${id}/`);
  return data;
}

export async function createTicket(payload: TicketWritePayload): Promise<TicketDetail> {
  const { data } = await apiClient.post<TicketDetail>("/tickets/", payload);
  return data;
}

export async function updateTicket(
  id: number,
  payload: Partial<TicketWritePayload>,
): Promise<TicketDetail> {
  const { data } = await apiClient.patch<TicketDetail>(`/tickets/${id}/`, payload);
  return data;
}

export async function transitionTicket(
  id: number,
  toStatus: TicketStatus,
  note = "",
): Promise<TicketDetail> {
  const { data } = await apiClient.post<TicketDetail>(`/tickets/${id}/transition/`, {
    to_status: toStatus,
    note,
  });
  return data;
}

export async function deleteTicket(id: number): Promise<void> {
  await apiClient.delete(`/tickets/${id}/`);
}

export async function exportTicketsCsv(params: TicketQueryParams): Promise<void> {
  const response = await apiClient.get<Blob>("/tickets/export/", {
    params,
    responseType: "blob",
  });
  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `opsdesk-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
