/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#FAFAFA',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F5F5',
          dark: '#0A0A0A'
        },
        text: {
          DEFAULT: '#0A0A0A',
          muted: '#525252',
          faint: '#A3A3A3'
        },
        rust: {
          DEFAULT: '#C2410C',
          deep: '#9A3412',
          tint: '#FFEDD5',
          'tint-bd': '#FED7AA'
        },
        hair: '#E4E4E7',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          600: '#4b5563',
          700: '#374151',
          900: '#111827'
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui'],
        body: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui'],
        heading: ['"Cabinet Grotesk"', '"IBM Plex Sans"', 'ui-sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        sm: '0.25rem'
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      }
    }
  },
  plugins: [],
}
