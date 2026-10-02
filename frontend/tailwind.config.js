/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        celadon: {
          DEFAULT: '#88D4AB',
          light: '#e2f3ea',
          bg: '#f2f9f5',
          border: '#c7e8d6',
          medium: '#5fb988',
          dark: '#2d7a52',
          deep: '#1e5638',
          darkest: '#123623',
        },
        procare: {
          50: '#f2f9f5',
          100: '#e2f3ea',
          200: '#c7e8d6',
          300: '#a5dabf',
          400: '#88d4ab',
          500: '#5fb988',
          600: '#3f9a69',
          700: '#2d7a52',
          800: '#1e5638',
          900: '#123623',
          950: '#0a2014',
        },
        hospital: {
          50: '#f2f9f5',
          100: '#e2f3ea',
          500: '#88d4ab',
          600: '#3f9a69',
          700: '#2d7a52',
          800: '#1e5638',
          900: '#123623',
        },
      },
    },
  },
  plugins: [],
};
