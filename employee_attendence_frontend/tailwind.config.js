/** @type {import('tailwindcss').Config} */
export default {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          primary: '#2563EB',
          secondary: '#F59E0B',
          surface: '#ffffff',
          background: '#f9fafb',
          text: '#111827',
          error: '#EF4444'
        }
      },
      boxShadow: {
        soft: '0 6px 18px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl: '12px'
      }
    }
  },
  plugins: []
};
