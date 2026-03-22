import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        doda: {
          orange: "#FF6B35",
          navy: "#1A2B4A",
          blue: "#2563EB",
        },
      },
    },
  },
  plugins: [],
};

export default config;
