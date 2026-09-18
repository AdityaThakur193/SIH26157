/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#FFFFFF',
        'surface-dim': '#F8F9FB',
        'surface-bright': '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F8F9FB',
        'surface-container': '#FFFFFF',
        'surface-container-high': '#F5F6F8',
        'surface-container-highest': '#ECEEF2',
        'on-surface': '#27282C',
        'on-surface-variant': '#858891',
        outline: '#E8E9ED',
        'outline-variant': '#F0F1F4',
        primary: '#5B4BA8',
        'on-primary': '#FFFFFF',
        'primary-container': '#EEEAFB',
        'on-primary-container': '#5B4BA8',
        secondary: '#F28B6A',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#FFF0EA',
        'on-secondary-container': '#C25430',
        tertiary: '#72D4DC',
        'on-tertiary': '#0F4448',
        'tertiary-container': '#E9FAFB',
        'on-tertiary-container': '#1D7179',
        error: '#D97878',
        'on-error': '#FFFFFF',
        'error-container': '#FDF2F2',
        'on-error-container': '#992B2B',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}