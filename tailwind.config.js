/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette premium
        primary: {
          DEFAULT: '#1A3A6B',
          50: '#EEF2F8',
          100: '#D4DFF0',
          200: '#A9BFE1',
          300: '#7E9FD2',
          400: '#537FC3',
          500: '#1A3A6B',
          600: '#153058',
          700: '#102545',
          800: '#0B1A32',
          900: '#060F1F',
        },
        accent: {
          DEFAULT: '#4F7FFF',
          50: '#EDF2FF',
          100: '#D4E2FF',
          200: '#A9C5FF',
          300: '#7EA8FF',
          400: '#4F7FFF',
          500: '#2D66F0',
          600: '#1A4FD4',
        },
        success: '#00C48C',
        warning: '#FFB020',
        danger: '#FF4D4F',
        fond: '#F7F9FC',
        texte: '#1A1A2E',
        'gris-texte': '#6B7280',
        'gris-bordure': '#E5E7EB',

        // Legacy aliases for gradual migration
        'bleu-republique': '#1A3A6B',
        'rouge-marianne': '#FF4D4F',
        succes: '#00C48C',
        avertissement: '#FFB020',
        'bleu-clair': '#EDF2FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26, 58, 107, 0.06), 0 1px 2px rgba(26, 58, 107, 0.04)',
        'card-hover': '0 10px 25px rgba(26, 58, 107, 0.1), 0 4px 10px rgba(26, 58, 107, 0.06)',
        'glass': '0 8px 32px rgba(26, 58, 107, 0.08)',
        'button': '0 2px 8px rgba(79, 127, 255, 0.25)',
        'button-hover': '0 4px 16px rgba(79, 127, 255, 0.35)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1A3A6B 0%, #2D5AA0 50%, #4F7FFF 100%)',
        'card-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F7F9FC 100%)',
        'accent-gradient': 'linear-gradient(135deg, #4F7FFF 0%, #00C48C 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(247,249,252,0.8) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
