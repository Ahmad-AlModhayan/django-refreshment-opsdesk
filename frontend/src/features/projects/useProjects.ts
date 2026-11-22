/**
 * Lifecycle Stage: Server-State Cache -> Annotated Projects Directory Hook
 * Production Invariant (🔴): Shares one ['projects'] cache across the directory, filter selects, and creation modal.
 * Trap Prevented (⚠️): Duplicate /api/projects/ network requests across sibling components.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "../../api/projects";

export const PROJECTS_QUERY_KEY = ["projects"] as const;

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: fetchProjects,
    staleTime: 60_000,
  });
}
