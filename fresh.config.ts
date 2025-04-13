import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  staticCacheControl: "public, max-age=31536000, immutable", // 1 year
});
