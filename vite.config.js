import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "192.168.1.148",
    port: 5173, // Optional: set your desired port
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
    // allowedHosts: true, // See security note below!
  },
});
