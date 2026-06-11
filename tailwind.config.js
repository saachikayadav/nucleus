/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        cyan: 'var(--cyan)',
        red: 'var(--red)',
        green: 'var(--green)',
        amber: 'var(--amber)',
        purple: 'var(--purple)',
        teal: 'var(--teal)',
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backdropBlur: { '24': '24px' },
    },
  },
  plugins: [],
};
