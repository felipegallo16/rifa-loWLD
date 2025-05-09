/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#4F46E5',
        background: '#F9FAFB',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
        border: {
          light: '#E5E7EB',
          dark: '#D1D5DB',
        },
      },
      boxShadow: {
        'ticket': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
} 