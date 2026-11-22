/**
 * Lifecycle Stage: Browser Entry -> React 19 StrictMode Mount & Theme Hydration
 * Production Invariant (🔴): Applies persisted theme before first paint and mounts inside React.StrictMode.
 * Trap Prevented (⚠️): Light-mode flash on dark reloads or leaked subscriptions hiding in dev builds.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const savedTheme = localStorage.getItem("opsdesk_theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark", savedTheme ? savedTheme === "dark" : prefersDark);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
