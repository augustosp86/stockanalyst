/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        surface: '#0F1526',
        card: '#141929',
        border: '#1E2D4A',
        cyan: '#00D4FF',
        green: '#00C853',
        red: '#FF3860',
        amber: '#FFB800',
        muted: '#8899B4',
        faint: '#4A5A7A',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
