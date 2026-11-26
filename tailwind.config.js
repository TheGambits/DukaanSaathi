/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0F766E',
          dark: '#12332F',
          amber: '#F59E0B',
          bg: '#F7F8F5',
          card: '#FFFFFF',
          text: '#263238',
          warning: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
