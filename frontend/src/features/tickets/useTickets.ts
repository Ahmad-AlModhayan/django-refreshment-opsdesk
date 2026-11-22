/**
 * Lifecycle Stage: Server-State Cache -> TanStack Query Hooks for Tickets, Users & Atomic Mutations
 * Production Invariant (🔴): Parameterized queryKeys + keepPreviousData prevent search race conditions and page flicker.
 * Trap Prevented (⚠️): Manual useEffect fetches overwriting newer results with stale slow responses.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers } from "../../api/auth";
import {
  createTicket,
  fetchTicketDetail,
  fetchTickets,
  transitionTicket,
  updateTicket,
  type TicketQueryParams,
} from "../../api/tickets";
import type { TicketStatus, TicketWritePayload } from "../../types/api";
import { DASHBOARD_QUERY_KEY } from "../dashboard/useDashboard";
import { PROJECTS_QUERY_KEY } from "../projects/useProjects";

export function useTickets(params: TicketQueryParams) {
  return useQuery({
    queryKey: ["tickets", params],
    queryFn: () => fetchTickets(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

export function useTicketDetail(ticketId: number | null) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicketDetail(ticketId!),
    enabled: ticketId !== null,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60_000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TicketWritePayload) => createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<TicketWritePayload> }) =>
      updateTicket(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useTransitionTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      toStatus,
      note,
    }: {
      id: number;
      toStatus: TicketStatus;
      note?: string;
    }) => transitionTicket(id, toStatus, note),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}
