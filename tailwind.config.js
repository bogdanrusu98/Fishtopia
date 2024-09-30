module.exports = {
  darkMode: 'class', // Activează modul dark pe baza clasei
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
    require('flowbite/plugin'),
  ],
  daisyui: {
    themes: ['light', 'dark'], // Activează temele light și dark
    darkTheme: "dark", // Specifică tema implicită pentru modul dark
  },
}
