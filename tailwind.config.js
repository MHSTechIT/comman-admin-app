/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f1a',
          card: '#16162a',
          border: '#2a2a4a',
          muted: '#6b6b8a',
        },
        accent: {
          purple: '#7c3aed',
          purpleLight: '#a78bfa',
        },
      },
    },
  },
  plugins: [],
}
