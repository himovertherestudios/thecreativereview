/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                crtr: {
                    black: '#0B0B0B',
                    surface: '#1A1A1A',
                    elevated: '#242424',
                    border: '#2A2A2A',
                    muted: '#A3A3A3',
                    orange: '#FF5A1F',
                    blue: '#3B82F6',
                    red: '#991B1B',
                    green: '#22C55E',
                    yellow: '#FACC15',
                },

                // Backward-compatible aliases for your existing app classes
                brand: {
                    black: '#0B0B0B',
                    gray: '#1A1A1A',
                    accent: '#FF5A1F',
                    critique: '#991B1B',
                },
            },
            borderRadius: {
                card: '18px',
                button: '12px',
            },
            boxShadow: {
                glow: '0 0 24px rgba(255, 90, 31, 0.22)',
                card: '0 20px 50px rgba(0,0,0,0.35)',
                soft: '0 12px 30px rgba(0,0,0,0.28)',
            },
        },
    },
    plugins: [],
};