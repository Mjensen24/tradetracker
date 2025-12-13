/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          card: '#1a1a1a',
          hover: '#2a2a2a',
          border: '#333333',
        },
        accent: {
          primary: '#a4fc3c',
          hover: '#8fdd2f',
        }
      }
    },
  },
  plugins: [],
}