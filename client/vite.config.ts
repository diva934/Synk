import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // face-api.js + TensorFlow.js reference Node.js globals — polyfill them for the browser
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["face-api.js"],
  },
});
