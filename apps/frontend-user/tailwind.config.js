/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3A8B73',
          hover: '#2E7A62',
        },
        secondary: '#E6F3EF',
        accent: '#4C9A84',
        text: {
          primary: '#1A1A1A',
          secondary: '#666666',
        },
        background: {
          primary: '#FFFFFF',
          secondary: '#F5F9F7',
        },
        border: '#A7D7C5',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'shake': 'shake 0.5s ease-in-out'
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333333',
            h1: {
              color: '#333333',
              fontWeight: '700',
              fontSize: '1.875rem',
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            h2: {
              color: '#333333',
              fontWeight: '700',
              fontSize: '1.5rem',
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            h3: {
              color: '#333333',
              fontWeight: '600',
              fontSize: '1.25rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            p: {
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
              lineHeight: '1.8',
            },
            ul: {
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
            },
            li: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            'ul > li': {
              paddingLeft: '1.5rem',
            },
            strong: {
              color: '#333333',
              fontWeight: '600',
            },
            blockquote: {
              fontWeight: '400',
              fontStyle: 'normal',
              color: '#666666',
              borderLeftColor: '#4C9A84',
              borderLeftWidth: '4px',
              paddingLeft: '1rem',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

