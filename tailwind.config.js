/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'seacom-blue': '#0057B8',
        'seacom-cyan': '#00D9FF',
        'seacom-navy': '#0D2240',
        'seacom-red': '#D7263D',
        'seacom-orange': '#F4811F',
        'seacom-amber': '#F5A623',
      },
    },
  },
  plugins: [],
}
