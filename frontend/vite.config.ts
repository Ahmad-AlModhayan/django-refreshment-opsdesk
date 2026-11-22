/**
 * Lifecycle Stage: Frontend Build & Dev Server -> Vite + Dev/Prod API Proxy Parity
 * Production Invariant (🔴): Proxies /api to Django so the app uses identical relative /api/... URLs in dev and Nginx prod.
 * Trap Prevented (⚠️): Hardcoding http://localhost:8000 in Axios and breaking production deploys or CORS preflights.
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/admin": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/static": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
