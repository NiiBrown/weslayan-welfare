import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E8F0FA",
          100: "#D1DFEF",
          200: "#A3BFD7",
          300: "#75A0C3",
          400: "#4780AF",
          500: "#1B4B8A",
          600: "#15407A",
          700: "#0E3666",
          800: "#0D2E5C",
          900: "#0A1B3D",
        },
        gold: {
          50: "#FDF6E8",
          100: "#FAEDC1",
          200: "#F5DB8A",
          300: "#E8C45A",
          400: "#C8963E",
          500: "#A87A2E",
          600: "#8A6324",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "'Segoe UI'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
