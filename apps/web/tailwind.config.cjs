module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#1B9AAA',
          mint: '#33C6B8',
          blue: '#3A86FF',
          green: '#4CAF50',
          gold: '#F0A500',
          ink: '#111827',
          inkMuted: '#374151',
          cloud: '#F4F9F9'
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
