/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sap: {
          blue: '#0070f2',
          'blue-dark': '#0040b0',
          'blue-light': '#e8f3ff',
          gold: '#f0ab00',
          green: '#107e3e',
          red: '#bb0000',
          gray: '#6a6d70',
          'gray-light': '#f5f6f7',
          'gray-border': '#d9dbdd',
        }
      }
    }
  },
  plugins: []
}
