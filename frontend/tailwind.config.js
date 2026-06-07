/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        picollo: {
          yellow: '#FFD700',
          black: '#121212',
          red: '#E63946',
          white: '#FFFFFF',
          zinc: '#1E1E1E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}