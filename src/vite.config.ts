import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  },
  server: {
    port: 3000,        // jalan di http://localhost:3000
    strictPort: true   // kalau 3000 kepakai, Vite akan error (tidak pindah port)
  }
});
