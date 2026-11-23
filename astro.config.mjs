import { defineConfig } from "astro/config";

const site = process.env.SITE_URL ?? "https://siobhanherne.com";
const base = process.env.SITE_BASE ?? "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  build: {
    format: "directory"
  }
});
