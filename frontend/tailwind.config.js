/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFF7EA",
        card: "#FFFDF8",
        ink: "#2B2118",
        turmeric: {
          DEFAULT: "#F2A93B",
          dark: "#D98E1F",
        },
        teal: {
          DEFAULT: "#1F6F5C",
          light: "#2E8C74",
          dark: "#154D40",
        },
        chili: "#D64933",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        ticket: "10px",
      },
      backgroundImage: {
        "hero-pattern": "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(31,111,92,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(242,169,59,0.10) 0%, transparent 60%)",
        "card-glow": "radial-gradient(circle at top right, rgba(31,111,92,0.06), transparent 50%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
