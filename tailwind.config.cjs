module.exports = {
  darkMode: "class",
  content: ["./*.html"],
  theme: {
    extend: {
      colors: {
        "on-secondary-container": "#745c00",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "on-secondary": "#ffffff",
        "primary": "#004d40",
        "surface-bright": "#fcf9f8",
        "surface-tint": "#29695b",
        "secondary-fixed-dim": "#e9c349",
        "inverse-on-surface": "#f3f0ef",
        "tertiary-fixed-dim": "#b5c8df",
        "primary-container": "#004d40",
        "on-tertiary-fixed-variant": "#36485b",
        "background": "#fcf9f8",
        "on-secondary-fixed-variant": "#574500",
        "tertiary-container": "#334557",
        "secondary-fixed": "#ffe088",
        "on-tertiary-fixed": "#091d2e",
        "on-surface-variant": "#3f4945",
        "on-primary-fixed": "#00201a",
        "tertiary-fixed": "#d1e4fb",
        "surface-container-highest": "#e5e2e1",
        "on-tertiary-container": "#9fb2c8",
        "outline-variant": "#bfc9c4",
        "secondary": "#735c00",
        "surface-dim": "#dcd9d9",
        "on-error": "#ffffff",
        "primary-fixed": "#afefdd",
        "surface-container": "#f0edec",
        "on-error-container": "#93000a",
        "surface": "#fcf9f8",
        "error": "#ba1a1a",
        "outline": "#707975",
        "inverse-surface": "#313030",
        "on-background": "#1c1b1b",
        "on-primary-container": "#7ebdac",
        "on-primary-fixed-variant": "#065043",
        "inverse-primary": "#94d3c1",
        "on-secondary-fixed": "#241a00",
        "error-container": "#ffdad6",
        "surface-variant": "#e5e2e1",
        "surface-container-high": "#ebe7e7",
        "tertiary": "#1c2f40",
        "on-primary": "#ffffff",
        "on-surface": "#1c1b1b",
        "primary-fixed-dim": "#94d3c1",
        "on-tertiary": "#ffffff",
        "secondary-container": "#fed65b"
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.5rem",
        xl: "0.75rem",
        xxl: "1.5rem",
        "3xl": "2rem",
        full: "9999px"
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        blob: "blob 7s infinite",
        "gradient-x": "gradient-x 15s ease infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" }
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" }
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center"
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center"
          }
        }
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ]
};
