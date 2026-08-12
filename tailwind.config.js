/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#13201f',
        sea: '#116d75',
        forest: '#1d6a43',
        sun: '#f2b84b',
        coral: '#d96945',
        mist: '#eef5f0',
        paper: '#fbfcf9',
      },
      boxShadow: {
        travel: '0 24px 70px rgba(19, 32, 31, 0.14)',
      },
    },
  },
  plugins: [],
};
