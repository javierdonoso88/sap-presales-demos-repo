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
          DEFAULT: '#0070f2',
          dark:    '#0057be',
          light:   '#e8f3ff',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f7f9fc',
          border: '#e2e8f0',
        },
        sidebar: {
          bg:     '#ffffff',
          hover:  '#f1f5f9',
          active: '#0070f2',
          text:   '#556070',
          'text-active': '#0070f2',
          border: '#e2e8f0',
        },
        sap: {
          blue: '#0070f2',
          'blue-dark': '#0057be',
          'blue-light': '#e8f3ff',
          gold: '#f0ab00',
          green: '#107e3e',
          red: '#bb0000',
          gray: '#6a6d70',
          'gray-light': '#f7f9fc',
          'gray-border': '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
}
