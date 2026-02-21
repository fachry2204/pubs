/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#019fbb',
        sidebar: '#ffffff',
        'sidebar-active': '#00d9ff',
        'accent-pink': '#E83E8C',
        background: '#F3F3F9',
      }
    },
  },
  plugins: [],
}
