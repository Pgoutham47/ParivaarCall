import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f5f8f5",
          100: "#e5eee6",
          200: "#cadccd",
          300: "#a6c2ac",
          400: "#7da184",
          500: "#5f8668",
          600: "#496a51",
          700: "#3d5644",
          800: "#344739",
          900: "#2d3d32"
        },
        care: {
          blush: "#f8ebe7",
          peach: "#f5c8b5",
          cream: "#fffaf3",
          ink: "#24322b",
          mint: "#e8f4ef",
          blue: "#dbeaf7"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(49, 78, 64, 0.10)",
        card: "0 10px 28px rgba(36, 50, 43, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [forms]
};

export default config;
