/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark teal palette
        dark: {
          900: '#0a1414',
          800: '#0d1a1a',
          700: '#142626',
          600: '#1a3333',
          500: '#234545',
        },
        // Gold accents
        gold: {
          400: '#FFCB9A',
          500: '#D9B08C',
          600: '#c49a76',
        },
        // Teal accents
        teal: {
          400: '#6ab0b0',
          500: '#4a9090',
          600: '#3a7070',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

