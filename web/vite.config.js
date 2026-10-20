import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const proxy = {
    "/api": {
      target: env.VITE_PROXY_TARGET || "http://127.0.0.1:8080",
      changeOrigin: true
    }
  };

  return {
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, strictPort: true, proxy }
  };
});