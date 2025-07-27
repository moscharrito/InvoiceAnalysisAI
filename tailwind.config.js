/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Existing primary (blue)
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // New Gold Luxe Theme
        gold: {
          50: '#fdfaf5',
          100: '#f9f1df',
          200: '#f2e3bd',
          400: '#e6c87c',
          500: '#d4af37', // classic gold
          600: '#b9922e',
          700: '#a17d29',
        },
        bronze: {
          500: '#b08d57',
          700: '#8a6c3c',
        },
        charcoal: {
          800: '#1f1f1f',
          900: '#121212',
        }
      },
      backgroundImage: {
        cutpaper: "url('/paper-texture.png')", // ensure this file exists in /public
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        elegant: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        gold: '0 4px 20px rgba(212, 175, 55, 0.25)',
      },
      transitionProperty: {
        spacing: 'margin, padding',
      },
    },
  },
  plugins: [],
}
