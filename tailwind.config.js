/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    black: '#0B0B0B',
                    surface: '#1A1A1A',
                    gray: '#1A1A1A',
                    white: '#F5F5F5',
                    accent: '#FF3B3B',
                    critique: '#FF3B3B',
                    muted: '#8A8A8A',
                },
            },
            fontFamily: {
                heading: ['Bebas Neue', 'Impact', 'Arial Narrow', 'sans-serif'],
                body: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'cr-soft': '0 18px 60px rgba(0, 0, 0, 0.35)',
                'cr-red': '0 18px 40px rgba(255, 59, 59, 0.18)',
            },
            borderRadius: {
                cr: '1.5rem',
                'cr-lg': '2rem',
            },
            backgroundImage: {
                'cr-radial':
                    'radial-gradient(circle at top left, rgba(255, 59, 59, 0.14), transparent 32%)',
                'cr-dark':
                    'linear-gradient(180deg, #0B0B0B 0%, #111111 45%, #0B0B0B 100%)',
            },
            letterSpacing: {
                cr: '0.22em',
            },
        },
    },
    plugins: [],
};