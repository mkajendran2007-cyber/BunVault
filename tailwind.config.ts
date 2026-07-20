import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "#FACC15",
          light: "#EAB308",
          gradientStart: "#FEF08A",
          gradientMid: "#FACC15",
          gradientEnd: "#CA8A04",
        },
        expense: {
          DEFAULT: "#FF3B30",
          soft: "rgba(255, 59, 48, 0.15)",
        },
        investment: {
          DEFAULT: "#00E676",
          soft: "rgba(0, 230, 118, 0.15)",
        },
        surface: {
          dark: "#0D1117",
          light: "#FFFFFF",
        },
        sidebar: {
          dark: "#08090B",
          light: "#FFFFFF",
        },
        emerald: {
          50: "#e0ffe5",
          100: "#b3ffc2",
          200: "#80ff9a",
          300: "#4dff73",
          400: "#26ff55",
          500: "#00E676", // Stark vivid neon green
          600: "#00b35c",
          700: "#008042",
          800: "#004d28",
          900: "#001a0d",
          950: "#000d06",
        },
        rose: {
          50: "#ffe5e9",
          100: "#ffb3be",
          200: "#ff8093",
          300: "#ff4d68",
          400: "#ff2647",
          500: "#FF1744", // Stark vivid high-contrast red
          600: "#cc1236",
          700: "#990e29",
          800: "#66091b",
          900: "#33050e",
          950: "#1a0207",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "loading-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(-3%)" },
          "50%": { transform: "translateY(0)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "loading-bar": "loading-bar 1.5s infinite ease-in-out",
        "bounce-subtle": "bounce-subtle 2s infinite ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
