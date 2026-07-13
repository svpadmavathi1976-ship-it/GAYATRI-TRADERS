import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        emerald: '#10b981',
        gold: '#d4af37',
      },
      boxShadow: {
        soft: '0 24px 60px -24px rgba(127, 99, 199, 0.24)',
      },
    },
  },
  plugins: [],
} satisfies Config;
