import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f0f5ef",
          100: "#e9eee7",
          200: "#dce4db",
          300: "#bfd0bf",
          400: "#91ad98",
          500: "#718777",
          600: "#5d7264",
          700: "#3d5e49",
          800: "#234b3d",
          900: "#183b2f",
        },
        care: {
          blush: "#f8ebe7",
          peach: "#f5c8b5",
          cream: "#faf8f2",
          ink: "#20352b",
          mint: "#e8f4ef",
          blue: "#dbeaf7",
        },
      },
      boxShadow: {
        soft: "0 24px 64px rgba(27, 54, 37, 0.12)",
        card: "0 2px 6px rgba(36, 50, 43, 0.04)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [forms],
};

export default config;
