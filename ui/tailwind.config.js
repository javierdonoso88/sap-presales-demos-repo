/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#4da6ff',
          dark:    '#0070f2',
        },
        sap: {
          blue: '#4da6ff',
          'blue-dark': '#0070f2',
          gold: '#fbbf24',
          green: '#34d399',
          red: '#f87171',
        },
      },
    },
  },
  plugins: [],
}
