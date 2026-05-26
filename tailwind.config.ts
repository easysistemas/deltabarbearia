import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D1B2A',
        surface: '#162440',
        'surface-hover': '#1B2D4F',
        border: '#2A3D5A',
        gold: {
          400: '#E0BB7A',
          500: '#C9A05A',
        },
        creme: {
          100: '#F0E6D3',
          200: '#A09070',
        },
        mahogany: '#3D2008',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
        script: ['var(--font-dancing)', 'cursive'],
      },
    },
  },
  plugins: [],
}
export default config
