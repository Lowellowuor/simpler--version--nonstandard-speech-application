/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // enable manual dark mode control
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',     // VoiceBridge blue
        secondary: '#7c3aed',   // accent purple
        background: '#f9fafb',
        darkBg: '#0f172a',
        lightText: '#1e293b',
        darkText: '#f1f5f9',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease-in-out',
        rollDown: 'rollDown 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        rollDown: {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
