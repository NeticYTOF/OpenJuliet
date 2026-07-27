/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/src/**/*.{ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        'bg-primary': {
          DEFAULT: '#0f0f13',
          50: '#f0f0f5',
          100: '#d4d4e0',
          200: '#b0b0c4',
          300: '#8585a0',
          400: '#5e5e7a',
          500: '#46465c',
          600: '#36364a',
          700: '#2a2a3a',
          800: '#1e1e2e',
          900: '#14141f',
          950: '#0f0f13'
        },
        'bg-secondary': {
          DEFAULT: '#1a1a25',
          50: '#f2f2f8',
          100: '#d9d9e8',
          200: '#b3b3d0',
          300: '#8a8ab5',
          400: '#63639a',
          500: '#4d4d80',
          600: '#3d3d68',
          700: '#2f2f52',
          800: '#232340',
          900: '#1a1a30',
          950: '#1a1a25'
        },
        'bg-tertiary': {
          DEFAULT: '#23233a',
          50: '#ededf5',
          100: '#cecee3',
          200: '#a0a0c9',
          300: '#6e6ead',
          400: '#4d4d93',
          500: '#3d3d79',
          600: '#323263',
          700: '#2a2a52',
          800: '#252545',
          900: '#23233a',
          950: '#1a1a2e'
        },
        surface: {
          DEFAULT: '#2a2a3e',
          50: '#f0f0f5',
          100: '#d6d6e3',
          200: '#b0b0ca',
          300: '#8585ac',
          400: '#5e5e8f',
          500: '#474774',
          600: '#3a3a5e',
          700: '#30304e',
          800: '#2a2a42',
          900: '#2a2a3e',
          950: '#1f1f30'
        },
        border: {
          DEFAULT: '#3a3a4e',
          50: '#f2f2f7',
          100: '#d9d9e6',
          200: '#b5b5cc',
          300: '#8c8cb0',
          400: '#666694',
          500: '#50507a',
          600: '#424264',
          700: '#3a3a54',
          800: '#3a3a4e',
          900: '#2d2d3e',
          950: '#1f1f2e'
        },
        'text-primary': {
          DEFAULT: '#f0f0f5',
          50: '#fafafa',
          100: '#f0f0f5',
          200: '#e0e0ed',
          300: '#c8c8dd',
          400: '#a8a8c5',
          500: '#8888ad',
          600: '#6c6c95',
          700: '#58587c',
          800: '#4a4a66',
          900: '#3f3f55',
          950: '#2a2a3a'
        },
        'text-secondary': {
          DEFAULT: '#a0a0bb',
          50: '#f5f5fa',
          100: '#e0e0ed',
          200: '#c4c4d9',
          300: '#a0a0bb',
          400: '#7c7c9c',
          500: '#636382',
          600: '#50506a',
          700: '#434358',
          800: '#3a3a4a',
          900: '#333340',
          950: '#22222e'
        },
        accent: {
          DEFAULT: '#8b5cf6',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065'
        },
        success: {
          DEFAULT: '#22c55e',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        info: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        }
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
        '42': '10.5rem',
        '46': '11.5rem',
        '50': '12.5rem',
        '54': '13.5rem',
        '58': '14.5rem',
        '62': '15.5rem',
        '66': '16.5rem',
        '70': '17.5rem',
        '74': '18.5rem',
        '78': '19.5rem',
        '82': '20.5rem',
        '86': '21.5rem',
        '90': '22.5rem',
        '94': '23.5rem',
        '98': '24.5rem',
        '100': '25rem',
        '104': '26rem',
        '108': '27rem',
        '112': '28rem',
        '120': '30rem',
        '128': '32rem',
        '136': '34rem',
        '144': '36rem',
        '152': '38rem',
        '160': '40rem'
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 8px rgba(139, 92, 246, 0.3), 0 0 16px rgba(139, 92, 246, 0.1)'
          },
          '50%': {
            boxShadow: '0 0 16px rgba(139, 92, 246, 0.6), 0 0 32px rgba(139, 92, 246, 0.3)'
          }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out'
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px'
      }
    }
  },
  plugins: []
}