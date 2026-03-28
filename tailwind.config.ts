import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0a0e17',
          card: '#141926',
          border: '#1e2a3a',
          muted: '#2a3a50',
        },
        accent: {
          red: '#ef4444',
          orange: '#ff6b2b',
          cyan: '#22d3ee',
          green: '#4ade80',
          yellow: '#ecc94b',
        },
        text: {
          primary: '#f0f4f8',
          secondary: '#8899aa',
          muted: '#556677',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Geist', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 4s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in forwards',
        'count-up': 'countUp 0.3s ease-out forwards',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          from: { boxShadow: '0 0 4px rgba(239, 68, 68, 0.3)' },
          to: { boxShadow: '0 0 12px rgba(239, 68, 68, 0.7)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
