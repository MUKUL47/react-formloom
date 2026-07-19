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
      // Roll the whole .d.ts tree up into one file per entry — dist/formloom.d.ts
      // and dist/validator.d.ts — instead of mirroring 70 files into the tarball.
      // API Extractor bundles TS 5.9 and only *warns* about this project's TS 6.x;
      // if that ever turns into a hard failure, drop this line and point the
      // `types` fields in package.json back at the mirrored tree.
      rollupTypes: true,
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
    // NOTE: dist/*.js looks unminified — identifiers are mangled but the
    // whitespace is intact. That is deliberate on Vite's part, not a missing
    // setting: for an ESM *library* build it forces `minifyWhitespace: false`
    // so the 778 `/* @__PURE__ */` annotations survive. Those annotations are
    // what let a consumer's bundler tree-shake the builder half away when they
    // import only `FormRenderer`. Full minification saves 7 kB gzipped and
    // destroys every one of them. `build.minify` is already "esbuild" here —
    // setting it changes nothing.
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
