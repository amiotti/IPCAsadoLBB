import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#f6f3ea",
        ink: "#1f1f1f",
        accent: "#9a3412",
        ok: "#166534",
        bad: "#b91c1c"
      }
    }
  },
  plugins: []
};

export default config;
