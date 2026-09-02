/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: '#0e0f11',
          panel: '#16181c',
          panel2: '#1c1f24',
          border: '#2a2e35',
          text: '#e6e8eb',
          muted: '#8b919a',
        },
        tag: {
          red: '#e5484d',
          yellow: '#e5c53d',
          green: '#3ecf7e',
        },
        accent: '#4f8cff',
      },
    },
  },
  plugins: [],
};
