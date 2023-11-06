/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/*",
    "./static/src/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],

  daisyui: {
    // themes: ["night", "dark", "drakula"],
  },
}

