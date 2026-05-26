import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        surface: {
          900: "#f8fafc",   // main background
          800: "#ffffff",   // card background
          700: "#f1f5f9",   // hover / secondary bg
          600: "#e2e8f0",   // borders
          500: "#cbd5e1",   // stronger borders
        },
        navy: {
          900: "#0c1f3f",
          800: "#0f2d52",
          700: "#1a3a6b",
          600: "#1e4080",
          500: "#2952a3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
