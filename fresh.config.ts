import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  staticCacheControl: "public, max-age=31536000, immutable", // 1 year
  server: {
    port: 8000,
    hostname: "0.0.0.0",
  },
});
