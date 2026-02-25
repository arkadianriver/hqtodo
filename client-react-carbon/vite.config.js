import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: '3001',
    proxy: {
      '/api': 'http://localhost:3000',
      '/todos/filelastupdated': 'http://localhost:3000'
    },
  },
  build: {
    outDir: './build'
  }
});