/**
 * Lifecycle Stage: Server-State Cache -> TanStack Query Hooks for Tickets, Users & Optimistic Mutations
 * Production Invariant (🔴): Parameterized queryKeys + keepPreviousData + optimistic transition rollback keep UI crisp and accurate.
 * Trap Prevented (⚠️): Manual useEffect fetches overwriting newer results with stale slow responses.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers } from "../../api/auth";
import {
  createTicket,
  deleteTicket,
  fetchTicketDetail,
  fetchTickets,
  transitionTicket,
  updateTicket,
  type TicketQueryParams,
} from "../../api/tickets";
import type {
  PaginatedResponse,
  Ticket,
  TicketDetail,
  TicketStatus,
  TicketWritePayload,
} from "../../types/api";
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
    onMutate: async ({ id, toStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["tickets"] });
      await queryClient.cancelQueries({ queryKey: ["ticket", id] });

      const previousLists = queryClient.getQueriesData<PaginatedResponse<Ticket>>({
        queryKey: ["tickets"],
      });
      const previousDetail = queryClient.getQueryData<TicketDetail>(["ticket", id]);

      // Optimistically reflect target status in visible tables while row-locked transition executes
      previousLists.forEach(([key, listData]) => {
        if (!listData) return;
        queryClient.setQueryData<PaginatedResponse<Ticket>>(key, {
          ...listData,
          results: listData.results.map((item) =>
            item.id === id ? { ...item, status: toStatus } : item,
          ),
        });
      });

      if (previousDetail) {
        queryClient.setQueryData<TicketDetail>(["ticket", id], {
          ...previousDetail,
          status: toStatus,
        });
      }

      return { previousLists, previousDetail };
    },
    onError: (_err, { id }, context) => {
      context?.previousLists.forEach(([key, listData]) => {
        queryClient.setQueryData(key, listData);
      });
      if (context?.previousDetail) {
        queryClient.setQueryData(["ticket", id], context.previousDetail);
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", updated.id], updated);
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTicket(id),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}
