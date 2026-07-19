/**
 * Build-only Tailwind config used to compile the shipped `dist/styles.css`.
 * Scans the library source so the emitted stylesheet contains exactly the
 * utility classes the builder + renderer use — nothing from the demo app.
 */
module.exports = {
  darkMode: "class",
  presets: [require("./tailwind-preset.cjs")],
  content: [
    "./src/components/**/*.{ts,tsx}",
  ],
  plugins: [require("tailwindcss-animate")],
};
