module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#4D9A93',
          green: '#3B8C5C',
          blue: '#0B7BC4',
          orange: '#D4A04C',
          charcoal: '#424242'
        }
      },
      borderRadius: {
        'lg': '14px'
      },
      boxShadow: {
        card: '0 6px 18px rgba(0,0,0,0.06)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { transform: 'translateY(6px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        }
      },
      animation: {
        fadeIn: 'fadeIn 180ms ease-out',
        slideUp: 'slideUp 180ms ease-out'
      }
    }
  },
  plugins: []
}
