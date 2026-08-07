/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Retro cinematic palette
        'cinema-black': '#0a0a0a',
        'cinema-dark': '#1a1a1a',
        'cinema-amber': '#d4a373',
        'cinema-gold': '#e9c46a',
        'cinema-cream': '#fefae0',
        'film-grain': '#2c2c2c',
      },
      fontFamily: {
        'display': ['"Courier New"', 'monospace'],
        'cinema': ['"Georgia"', 'serif'],
      },
      boxShadow: {
        'vintage': '0 0 30px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.4)',
        'cinema': '0 0 50px rgba(0,0,0,0.9), 0 0 100px rgba(0,0,0,0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite alternate',
        'typewriter': 'typewriter 2s steps(40) forwards',
      },
      keyframes: {
        flicker: {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.9 },
          '100%': { opacity: 1 },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
}