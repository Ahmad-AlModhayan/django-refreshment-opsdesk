/**
 * Lifecycle Stage: Client Observability -> Live HTTP & SQL Telemetry Ring Buffer
 * Production Invariant (🔴): Captures X-DB-Query-Count and X-Response-Time-Ms without re-rendering unrelated trees.
 * Trap Prevented (⚠️): Storing volatile telemetry in React Context and causing full-app re-renders on every API call.
 */
import { useSyncExternalStore } from "react";
import type { TelemetryRecord } from "../types/api";

const MAX_EVENTS = 25;
let events: TelemetryRecord[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function recordTelemetry(entry: Omit<TelemetryRecord, "id" | "timestamp">): void {
  const next: TelemetryRecord = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  events = [next, ...events].slice(0, MAX_EVENTS);
  emit();
}

export function clearTelemetry(): void {
  events = [];
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): TelemetryRecord[] {
  return events;
}

export function useTelemetryEvents(): TelemetryRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
