import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Aapka Astro Brand Identity Palette
        maroon: {
          DEFAULT: "#7B2D26",
          50: "#fdf4f3",
          100: "#fbe8e6",
          500: "#7B2D26",
          700: "#60211c",
          800: "#521d18",
          900: "#3d1310",
        },
        gold: {
          DEFAULT: "#E8A33D",
          50: "#fdf8ee",
          100: "#fcf0d8",
          400: "#f2be6b",
          500: "#E8A33D",
          600: "#cb8423",
          700: "#a36217",
        },
        terracotta: {
          DEFAULT: "#C1662F",
          50: "#fbf5f0",
          100: "#f6e8dc",
          500: "#C1662F",
          600: "#a55020",
          700: "#863c15",
        },
        ivory: {
          DEFAULT: "#FBF3E7",
          50: "#fdfbf7",
          100: "#FBF3E7",
          200: "#f5e4ce",
        },
        deepbrown: {
          DEFAULT: "#3B2A1E",
          800: "#3B2A1E",
          900: "#261a12",
        },
        sage: {
          DEFAULT: "#6B8E5A",
          50: "#f5f8f3",
          100: "#e8efe4",
          500: "#6B8E5A",
          600: "#547345",
          700: "#425b36",
        },
      },
      fontFamily: {
        heading: ["var(--font-cinzel)", "var(--font-yatra)", "serif"],
        serif: ["var(--font-cinzel)", "var(--font-yatra)", "serif"],
        body: ["var(--font-mukta)", "var(--font-poppins)", "sans-serif"],
        sans: ["var(--font-mukta)", "var(--font-poppins)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
