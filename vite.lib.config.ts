import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "path";

// Library build config for the npm package `formloom`.
// Emits a single ESM bundle + a rolled-up index.d.ts. CSS is built
// separately via the `build:css` script (Tailwind CLI), because the
// components carry no CSS imports of their own — styling is delivered
// as a standalone `styles.css` and/or a Tailwind preset.
export default defineConfig({
  plugins: [
    react(),
    dts({
      // API Extractor's `rollupTypes` chokes on the project's TS 6.x output,
      // so we emit a mirrored .d.ts tree instead. vite-plugin-dts still
      // rewrites the `@/…` path alias into relative paths in the output.
      tsconfigPath: "./tsconfig.build.json",
      entryRoot: "src",
      include: ["src/components/**/*.ts", "src/components/**/*.tsx", "src/lib/**/*.ts", "src/validator/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.test.tsx"], // never emit .d.ts for test files
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      // Two standalone entries:
      //  • the React builder/renderer (formloom.js)
      //  • the framework-agnostic Zod validator (validator.js — no React)
      entry: {
        "formloom": path.resolve(__dirname, "src/components/react-custom-form-builder/index.ts"),
        "validator": path.resolve(__dirname, "src/validator/schema-to-zod.ts"),
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      // Externalize every bare specifier (react, react-dom, radix, dnd-kit,
      // lucide, cmdk, monaco, date-fns, …). The `@/…` alias is resolved to an
      // absolute path before this runs, so internal UI primitives stay bundled.
      external: (id) =>
        !id.startsWith(".") &&
        !path.isAbsolute(id) &&
        !id.startsWith("@/"),
    },
  },
});
