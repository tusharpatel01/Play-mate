/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d",
        },
        dark: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          700: "#1e293b",
          800: "#0f172a",
          850: "#0d1117",
          900: "#010409",
        },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-green": "pulseGreen 2s infinite",
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseGreen: { "0%,100%": { boxShadow: "0 0 0 0 rgba(74,222,128,0.4)" }, "50%": { boxShadow: "0 0 0 8px rgba(74,222,128,0)" } },
      },
    },
  },
  plugins: [],
};
