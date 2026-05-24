/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './context/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '360px',
      },
      colors: {
        /* ── Brand ── */
        primary:           'var(--primary)',
        'primary-light':   'var(--primary-light)',
        'primary-surface': 'var(--primary-surface)',
        accent:            'var(--accent)',
        'accent-light':    'var(--accent-light)',

        /* ── App palette (mirrors CSS vars) ── */
        bg:               'var(--bg)',
        surface:          'var(--surface)',
        'surface-alt':    'var(--surface-alt)',
        border:           'var(--border)',
        'border-strong':  'var(--border-strong)',

        /* ── Text ── */
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['11px', { lineHeight: '16px' }],
        sm:    ['13px', { lineHeight: '18px' }],
        base:  ['14px', { lineHeight: '20px' }],
        md:    ['15px', { lineHeight: '22px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '26px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['22px', { lineHeight: '30px' }],
      },

      borderRadius: {
        xl:   '12px',
        '2xl':'16px',
        '3xl':'20px',
        '4xl':'24px',
      },

      boxShadow: {
        card:    'var(--shadow-sm)',
        'card-md':'var(--shadow-md)',
        'card-lg':'0 6px 24px rgba(26,26,46,0.12), 0 2px 8px rgba(0,0,0,0.07)',
      },

      spacing: {
        sidebar: 'var(--sidebar-w)',
        topbar:  'var(--topbar-h)',
      },

      /* Tailwind-safe animation */
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.7)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up':  'fadeUp 0.35s ease forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
    },
  },
  plugins: [],
};
