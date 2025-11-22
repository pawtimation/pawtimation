module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#008080',
          graphite: '#2A2D34',
          cloud: '#F5F7FA',
          mint: '#A8E6CF',
          error: '#E63946',
          success: '#4CAF50',
          slate: '#1C1E21'
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
