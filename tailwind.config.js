/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#163526",
          container: "#2D4C3B",
          fixed: "#C7EBD4",
          "fixed-dim": "#ACCfb8",
        },
        secondary: {
          DEFAULT: "#556348",
          container: "#D9E8C7",
          fixed: "#D9E8C7",
          "fixed-dim": "#BDCBAC",
        },
        tertiary: {
          DEFAULT: "#462806",
          container: "#603E1A",
          fixed: "#FFDCBD",
          "fixed-dim": "#EEBD8E",
        },
        surface: {
          DEFAULT: "#FCF9F0",
          dim: "#DDDAD1",
          bright: "#FCF9F0",
          variant: "#E5E2DA",
          container: {
            lowest: "#FFFFFF",
            low: "#F6F3EA",
            DEFAULT: "#F1EEE5",
            high: "#EBE8DF",
            highest: "#E5E2DA",
          },
        },
        "on-primary": {
          DEFAULT: "#FFFFFF",
          container: "#99BCA6",
        },
        "on-secondary": {
          DEFAULT: "#FFFFFF",
          container: "#5B694E",
        },
        "on-tertiary": {
          DEFAULT: "#FFFFFF",
          container: "#D9AA7D",
        },
        "on-surface": {
          DEFAULT: "#1C1C17",
          variant: "#424843",
        },
        outline: {
          DEFAULT: "#727973",
          variant: "#C2C8C1",
        },
        error: {
          DEFAULT: "#BA1A1A",
          container: "#FFDAD6",
        },
        "on-error": {
          DEFAULT: "#FFFFFF",
          container: "#93000A",
        },
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
