const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-inter)", "Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        shade: {
          1: "#141414",
          2: "#101010",
          3: "#191919",
          4: "#222222",
          5: "#4c4c4c",
          6: "#727272",
          7: "#7b7b7b",
          8: "#e2e2e2",
          9: "#f1f1f1",
          10: "#fdfdfd",
        },
        primary: {
          1: "#2a85ff",
          2: "#00a656",
          3: "#ff381c",
          4: "#7f5fff",
          5: "#ff9d34",
        },
        background: {
          surface1: "#f1f1f1",
          surface2: "#ffffff",
          surface3: "#f1f1f180",
          dark1: "#191919",
          dark2: "#141414",
        },
        chart: {
          green: "#00b512",
          purple: "#7f5fff",
          yellow: "#ff9d34",
          min: "#e2e2e2",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        depth: "0px 2.15px .5px -2px #00000040,0px 24px 24px -16px #0808080a,0px 6px 13px 0px #08080808,0px 6px 4px -4px #0808080d,0px 5px 1.5px -4px #08080817",
        widget: "0px 5px 1.5px -4px #08080817,0px 6px 4px -4px #0808080d",
      },
    },
  },
  plugins: [],
};
