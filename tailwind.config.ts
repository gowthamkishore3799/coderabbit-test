import type { Config } from 'tailwindcss';

// Tailwind CSS v4 Configuration
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './*.{html,ts,tsx}',
  ],
  theme: {
    extend: {
      // Tailwind v4: Enhanced color system
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#7c3aed',
        },
      },
      // Tailwind v4: Advanced spacing system
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      // Tailwind v4: Custom animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Tailwind v4: Container queries support
      containerQueries: {
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
      },
      // Tailwind v4: Enhanced typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  // Tailwind v4: New plugins system
  plugins: [],
  // Tailwind v4: Performance optimizations
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Tailwind v4: Experimental features
  experimental: {
    optimizeUniversalDefaults: true,
  },
};

export default config;
