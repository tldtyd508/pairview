import type { Config } from "tailwindcss";

const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

export default config;
