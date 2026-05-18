/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Точные токены из SOS24/sos-system.jsx
        page: 'rgb(228,228,228)',
        ink: {
          DEFAULT: 'rgb(21,21,21)',
          dark: 'rgb(18,18,18)',
          muted: 'rgb(95,94,94)',
          subtle: 'rgb(77,77,77)',
          mutedDark: 'rgb(224,224,224)',
        },
        brand: {
          red: 'rgb(230,20,40)',
          redSoft: 'rgba(230,20,40,0.6)',
          black: '#010101',
          white: '#FFFFFF',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.5)',
          strong: 'rgba(255,255,255,0.9)',
          thin: 'rgba(255,255,255,0.04)',
        },
        hairline: 'rgba(20,20,20,0.08)',
        success: 'rgb(105,228,183)',
        warning: 'rgb(245,200,80)',
        danger: 'rgb(230,20,40)',
      },
      fontFamily: {
        mont: ['NeueMontreal-Regular'],
        'mont-medium': ['NeueMontreal-Medium'],
        'mont-bold': ['NeueMontreal-Bold'],
        'mont-light': ['NeueMontreal-Light'],
        manrope: ['Manrope_400Regular'],
        'manrope-medium': ['Manrope_500Medium'],
        'manrope-semibold': ['Manrope_600SemiBold'],
        'manrope-bold': ['Manrope_700Bold'],
      },
    },
  },
  plugins: [],
};
