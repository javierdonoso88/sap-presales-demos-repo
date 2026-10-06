/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // New design system tokens
        brand: {
          DEFAULT: '#2563eb',
          dark:    '#1d4ed8',
          light:   '#eff6ff',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#fafafa',
          border: '#e4e4e7',
        },
        sidebar: {
          bg:     '#18181b',
          hover:  '#27272a',
          active: '#2563eb',
          text:   '#a1a1aa',
          'text-active': '#ffffff',
        },
        // Keep sap.* for any unrewritten code
        sap: {
          blue: '#2563eb',
          'blue-dark': '#1d4ed8',
          'blue-light': '#eff6ff',
          gold: '#f0ab00',
          green: '#107e3e',
          red: '#bb0000',
          gray: '#6a6d70',
          'gray-light': '#fafafa',
          'gray-border': '#e4e4e7',
        },
      },
    },
  },
  plugins: [],
}
