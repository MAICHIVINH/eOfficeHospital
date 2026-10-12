/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0faff',
                    100: '#e0f2fe',
                    200: '#bae7fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#028fc7',
                    700: '#036ea1',
                    800: '#075a85',
                    900: '#0c4d6e',
                },
                medical: {
                    teal: '#0d9488',
                    slate: '#475569',
                    indigo: '#4f46e5',
                    cyan: '#0891b2',
                    rose: '#e11d48',
                },
                hospital: {
                    blue: '#0284c7',
                    green: '#10b981',
                    red: '#ef4444',
                    yellow: '#f59e0b',
                    gray: '#6b7280',
                },
            },
            boxShadow: {
                'clinical': '0 8px 30px rgba(0, 0, 0, 0.04)',
                'clinical-dark': '0 8px 30px rgba(0, 0, 0, 0.2)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
