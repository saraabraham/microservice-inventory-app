/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'ikea-blue': '#0051BA',
                'ikea-yellow': '#FFDB00',
            }
        },
    },
    plugins: [],
}