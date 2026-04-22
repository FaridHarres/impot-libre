/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bleu-republique': '#003189',
        'rouge-marianne': '#E1000F',
        'fond': '#F5F5FE',
        'texte': '#1E1E1E',
        'succes': '#18753C',
        'bleu-clair': '#E3E3FD',
        'gris-bordure': '#DDDDDD',
        'gris-texte': '#666666',
        'avertissement': '#B34000',
        'danger': '#E1000F',
      },
      fontFamily: {
        marianne: ['Marianne', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
