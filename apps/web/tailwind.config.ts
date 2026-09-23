import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // We enforce light theme only across all views
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#f8fafc',       // slate-50
          card: '#ffffff',     // white
          panel: '#ffffff',    // white
          sub: '#f1f5f9',      // slate-100
          border: '#e2e8f0',   // slate-200
          borderDark: '#cbd5e1', // slate-300
          text: '#0f172a',     // slate-900
          muted: '#64748b',    // slate-500
          accent: '#4f46e5',   // indigo-600
          accentLight: '#e0e7ff', // indigo-100
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
