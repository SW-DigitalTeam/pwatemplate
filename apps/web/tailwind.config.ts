import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // All programme identity flows through CSS variables set by ProgrammeTheme.
      colors: {
        primary: "var(--sw-primary)",
        "primary-contrast": "var(--sw-primary-contrast)",
        surface: "var(--sw-surface)",
        "surface-text": "var(--sw-surface-text)",
        accent: "var(--sw-accent)",
      },
      borderRadius: { theme: "var(--sw-radius)" },
      fontFamily: {
        display: "var(--sw-font-display)",
        body: "var(--sw-font-body)",
      },
    },
  },
  plugins: [],
} satisfies Config;
