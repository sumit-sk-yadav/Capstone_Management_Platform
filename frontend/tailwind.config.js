/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                capstone: {
                    teal: '#0EA5A4',
                    blue: '#3B82F6',
                    dark: '#0f172a',
                    slate: '#f8fafc',
                    gray: '#64748b',
                    bg: '#f8fafc', // Light background
                }
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #0EA5A4, #3B82F6)',
                'gradient-bg': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            }
        },
    },
    plugins: [],
}
