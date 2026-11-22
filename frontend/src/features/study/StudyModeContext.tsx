/**
 * Lifecycle Stage: Embedded Learning System -> Study Mode Toggle & Active Context Sync
 * Production Invariant (🔴): Defaults to OFF so OpsDesk ships as a pure enterprise portal until toggled ON.
 * Trap Prevented (⚠️): Cluttering operational UI permanently with educational chrome.
 */
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";

export type StudyScreenKey = "dashboard" | "tickets" | "projects" | "audit";

interface StudyModeContextValue {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (next: boolean) => void;
  activeDrawerOpen: boolean;
  setActiveDrawerOpen: (open: boolean) => void;
}

const StudyModeContext = createContext<StudyModeContextValue | null>(null);

export function StudyModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [activeDrawerOpen, setActiveDrawerOpen] = useState(false);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ enabled, toggle, setEnabled, activeDrawerOpen, setActiveDrawerOpen }),
    [enabled, toggle, activeDrawerOpen],
  );

  return <StudyModeContext value={value}>{children}</StudyModeContext>;
}

export function useStudyMode(): StudyModeContextValue {
  const ctx = use(StudyModeContext);
  if (!ctx) throw new Error("useStudyMode must be used inside StudyModeProvider");
  return ctx;
}
