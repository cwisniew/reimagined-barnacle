import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Your backend server address
        changeOrigin: true,
        // secure: false, // Uncomment if your backend is not HTTPS
        // rewrite: (path) => path.replace(/^\/api/, "") // Uncomment if your backend API does not have /api prefix
      },
    },
  },
});
