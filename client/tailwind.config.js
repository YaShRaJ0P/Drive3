/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        elianto: ["Elianto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
