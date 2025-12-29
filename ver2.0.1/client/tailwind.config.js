/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        gold: {
          50: '#fff9e6',
          100: '#ffefb3',
          200: '#ffe680',
          300: '#ffdd4d',
          400: '#ffd41a',
          500: '#e6b800',
          600: '#b38f00',
          700: '#806600',
          800: '#4d3d00',
          900: '#1a1400',
        },
        primary: {
          DEFAULT: '#102a43',
          light: '#334e68',
          dark: '#0a1c2e',
        },
        accent: {
          DEFAULT: '#e6b800',
          light: '#ffd41a',
          dark: '#b38f00',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'book': '0 4px 20px rgba(16, 42, 67, 0.1)',
        'book-hover': '0 8px 30px rgba(16, 42, 67, 0.15)',
        'nav': '0 2px 10px rgba(16, 42, 67, 0.1)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #e6b800 0%, #ffd41a 100%)',
        'gradient-navy': 'linear-gradient(135deg, #102a43 0%, #334e68 100%)',
        'gradient-book': 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 100%)',
      },
    },
  },
  plugins: [],
}