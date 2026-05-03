import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        forest: "#1f6f4a",
        mint: "#dff5e8",
        gold: "#c98a20",
        paper: "#f8faf7"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(23, 33, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
