/**
 * Lifecycle Stage: Frontend Build & Dev Server -> Vite + Dev/Prod API Proxy Parity + Vendor Code Splitting
 * Production Invariant (🔴): Proxies /api to Django for identical relative paths and splits motion/vendor bundles.
 * Trap Prevented (⚠️): Hardcoding localhost URLs in Axios or shipping monolithic >500 kB initial JS chunks.
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "motion", test: /node_modules[\\/]framer-motion/ },
            { name: "query-http", test: /node_modules[\\/](@tanstack|axios)/ },
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom|react-router)/ },
          ],
        },
      },
    },
  },
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
