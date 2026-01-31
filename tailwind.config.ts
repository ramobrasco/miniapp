import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        balsamiq: ["var(--font-balsamiq)", "sans-serif"],
      },
      colors: {
        base: {
          blue: "#0052FF",
          "blue-hover": "#0046E0",
          "blue-light": "#3370FF",
        },
      },
    },
  },
  plugins: [],
};
export default config;
