import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { transform } from "esbuild";
import path from "path";

/**
 * Minify the ESM library output ourselves.
 *
 * Vite will not do it. `minify: "esbuild"` hits a carve-out that forces
 * `minifyWhitespace: false` for ES lib builds, and `minify: "terser"` hits
 * `if (config.build.lib && outputOptions.format === "es") return null` — the
 * terser plugin bails out entirely. Both exist to protect the
 * `/* @__PURE__ *\/` annotations that let a consumer's bundler tree-shake
 * unused exports; minifying consumes and drops them. That cost is accepted
 * here in exchange for a ~30% smaller file.
 *
 * Runs at `enforce: "post"`, so it sees the final chunk after Vite's own
 * esbuild pass, and returns a sourcemap that Rollup chains onto the rest.
 */
function minifyEsLib(): Plugin {
  return {
    name: "minify-es-lib",
    enforce: "post",
    async renderChunk(code, chunk, outputOptions) {
      if (outputOptions.format !== "es") return null;
      const result = await transform(code, {
        minify: true,
        target: "es2020",
        format: "esm",
        sourcemap: true,
        sourcefile: chunk.fileName,
        legalComments: "none",
      });
      return { code: result.code, map: result.map };
    },
  };
}

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
    minifyEsLib(),
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
    // Both of these exist to get Vite's internal esbuild renderChunk pass to
    // bail out (it returns early only when the target is esnext AND minify is
    // off). That pass is registered AFTER user `post` plugins, so if it runs it
    // re-prints minifyEsLib()'s output with the whitespace put back. The plugin
    // does the es2020 lowering and the minification itself.
    target: "esnext",
    minify: false,
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
