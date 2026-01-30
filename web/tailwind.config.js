/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kindred-inspired palette
        primary: {
          dark: '#292D32',
          DEFAULT: '#3A3F44',
        },
        neutral: {
          cream: '#FAF8F6',
          beige: '#F5F1ED',
          warm: '#E8E4E0',
        },
        text: {
          primary: '#2C2C2C',
          secondary: '#6B6B6B',
          light: '#9CA3AF',
        },
        accent: {
          terracotta: '#C97D60',
          olive: '#8B9A7E',
          sage: '#A8B5A0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'soft-xl': '0 8px 24px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

