/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        zoom: {
          bg:      "#1a1a1a",
          surface: "#242424",
          border:  "#2e2e2e",
          tile:    "#2d2d2d",
          blue:    "#2d6ade",
          green:   "#168a2b",
          red:     "#cf2020",
        },
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
