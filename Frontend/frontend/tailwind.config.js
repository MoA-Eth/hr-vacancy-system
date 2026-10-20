/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#edf7ed',
          100: '#d0ecd0',
          200: '#a3d6a3',
          300: '#6fba6f',
          400: '#3f9b3f',
          500: '#1a7a1a',
          600: '#095209',
          700: '#074507',
          800: '#053805',
          900: '#032803',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

