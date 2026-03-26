/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arcanum: {
          gold: '#FFD700',
          blue: '#1A237E',
          gray: '#607D8B',
          red: '#B71C1C',
        }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        'cinzel-decorative': ['Cinzel Decorative', 'serif'],
      }
    },
  },
  plugins: [],
}
