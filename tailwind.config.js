/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7A4A88', // Custom Purple
        sidebar: '#2E2E48', // Dark Navy
        'sidebar-active': '#27273F',
        'accent-pink': '#E83E8C',
        background: '#F3F3F9',
      }
    },
  },
  plugins: [],
}
