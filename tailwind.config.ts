import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f766e",
          foreground: "#f9fafb"
        },
        secondary: {
          DEFAULT: "#1f2937",
          foreground: "#f9fafb"
        }
      }
    }
  },
  plugins: []
};

export default config;
