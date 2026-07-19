import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Docs-site build (GitHub Pages).  The publishable library is built by
// vite.lib.config.ts — that one owns `dist/`, this one writes `dist-site/`
// so the two can never clobber each other.
//
// Pages serves a project repo under a sub-path, so assets must be requested
// from /react-formloom/ — hence `base`.  Override with SITE_BASE=/ for a
// local `vite preview` at the root.
export default defineConfig({
  base: process.env.SITE_BASE ?? "/react-formloom/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-site",
    emptyOutDir: true,
  },
});
