/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Neurocare logo palette — navy "Neuro" / blue head / teal "care" / green arc
        brand: {
          50: '#eef5fc',
          100: '#d7e8f8',
          200: '#afd1f1',
          300: '#7db3e6',
          400: '#3f8fd9',
          500: '#0a75cb',
          600: '#0d5ca8',
          700: '#11417e',
          800: '#0d3365',
          900: '#0a2850'
        },
        accent: {
          50: '#e8f8f6',
          100: '#c8eeea',
          200: '#94ded6',
          300: '#5ccbc0',
          400: '#26b7aa',
          500: '#08a599',
          600: '#078a80',
          700: '#086f68',
          800: '#0b5a55',
          900: '#0c4a47'
        },
        leaf: {
          300: '#c5e48f',
          400: '#a3d65c',
          500: '#8dc63f',
          600: '#74a82f'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 24px rgba(17,65,126,0.08)'
      },
      animation: {
        'scroll-left': 'scroll-left 50s linear infinite',
      },
      keyframes: {
        'scroll-left': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    }
  },
  plugins: []
};
