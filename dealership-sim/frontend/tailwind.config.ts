import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020817',
        foreground: '#F8FAFC',
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#f8fafc',
        },
        muted: {
          DEFAULT: '#1e293b',
          foreground: '#94a3b8',
        },
        accent: {
          DEFAULT: '#38bdf8',
          foreground: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
