import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "frontend",
  build: {
    outDir: "../dist/frontend",
    emptyOutDir: true
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3001"
    }
  },
  preview: {
    port: 3000,
    strictPort: true
  }
});
