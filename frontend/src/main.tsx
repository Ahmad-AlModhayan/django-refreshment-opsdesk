/**
 * Lifecycle Stage: Browser Entry -> React 19 StrictMode Mount
 * Production Invariant (🔴): Enables React.StrictMode in dev to catch impure renders and missing effect cleanups early.
 * Trap Prevented (⚠️): Shipping leaked event listeners or uncleaned subscriptions to production.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
