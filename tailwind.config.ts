import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--base)",
        text: "var(--text)",
        purple: "var(--purple)",
        lavender: "var(--lavender)",
        butter: "var(--butter)",
        orchid: "var(--orchid)",
        "deep-butter": "var(--deep-butter)",
        plum: "var(--plum)",
      },
      fontFamily: {
        satoshi: ["Satoshi", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
