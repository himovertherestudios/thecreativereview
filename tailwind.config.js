/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            colors: {
                'brand-black': '#0A0A0A',
                'brand-gray': '#1A1A1A',
                'brand-accent': '#E5FF45',
                'brand-critique': '#FF4D4D',
            },
        },
    },
    plugins: [],
};