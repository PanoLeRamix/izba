/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#2D5A27",
          light: "#3E7B35",
          dark: "#1B3617",
        },
        sage: {
          DEFAULT: "#A3B18A",
          light: "#DAD7CD",
        },
        hearth: {
          DEFAULT: "#F9F7F2",
          warm: "#FAF3E0",
          earth: "#582F0E",
        },
      },
    },
  },
  plugins: [],
};
