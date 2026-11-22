/**
 * Lifecycle Stage: API Service -> Annotated Projects Directory
 * Production Invariant (🔴): Fetches all projects and live ticket counts in one annotated SQL query.
 * Trap Prevented (⚠️): Issuing separate /tickets/?project=X requests per project card on the frontend.
 */
import type { Project } from "../types/api";
import { apiClient } from "./client";

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>("/projects/");
  return data;
}
