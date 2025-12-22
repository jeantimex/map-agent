import { defineConfig } from "vite";

export default defineConfig({
  base: "/map-agent/",
  server: {
    proxy: {
      "/weather-api": {
        target: "https://weather.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weather-api/, ""),
      },
    },
  },
});
