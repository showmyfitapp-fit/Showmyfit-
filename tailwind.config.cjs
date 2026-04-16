/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './views/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5F3F0',
        warm: {
          50: '#FAF9F7',
          100: '#F5F3F0',
          200: '#E8E4DE',
          300: '#D4CFC6',
          400: '#B8B0A3',
          500: '#9C8F7E',
          600: '#8A7B68',
          700: '#6B5D4F',
          800: '#4A3F35',
          900: '#2D251E'
        },
        sage: {
          50: '#F7F8F7',
          100: '#E8EBE8',
          200: '#D1D7D1',
          300: '#A8B5A8',
          400: '#7A8A7A',
          500: '#5A6B5A',
          600: '#4A5A4A',
          700: '#3A473A',
          800: '#2A342A',
          900: '#1A211A'
        },
        primary: {
          50: '#F3E8FF',
          100: '#E9D5FF',
          200: '#D8B4FE',
          300: '#C084FC',
          400: '#A855F7',
          500: '#9333EA',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95'
        }
      },
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
};
