/**
 * Tailwind preset for `formloom`.
 *
 * Consumers who already use Tailwind can wire the builder/renderer into
 * their own build instead of shipping the prebuilt `styles.css`:
 *
 *   // tailwind.config.js
 *   module.exports = {
 *     presets: [require("formloom/tailwind-preset")],
 *     content: [
 *       "./src/**\/*.{ts,tsx}",
 *       "./node_modules/formloom/dist/**\/*.js",
 *     ],
 *   };
 *
 * The preset maps the shadcn-style CSS variables to Tailwind color tokens.
 * You still need to define the variables themselves once (see the
 * `:root` / `.dark` block in the README, or import the shipped
 * `formloom/styles.css` which already includes them).
 */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
