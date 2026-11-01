/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens are driven by CSS variables (see src/styles/index.css)
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          muted: 'hsl(var(--surface-muted) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          foreground: 'hsl(var(--danger-foreground) / <alpha-value>)',
        },
        critical: {
          DEFAULT: 'hsl(var(--critical) / <alpha-value>)',
          foreground: 'hsl(var(--critical-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      maxWidth: {
        // Content column of the public marketing pages (navbar, sections, footer all share it, so
        // their left/right edges line up). Wider = smaller side margins on large screens.
        page: '100rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // The app's dense scale (dashboard, forms) — also what the landing page's product
        // mock-ups use, since they imitate the app.
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.5rem' }],
        lg: ['1rem', { lineHeight: '1.75rem' }],
        xl: ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.375rem', { lineHeight: '1.875rem' }],
        '3xl': ['1.75rem', { lineHeight: '2.125rem' }],

        // Semantic type for the public marketing pages. Each token carries its own line-height,
        // tracking and weight, so one class sets the whole treatment and the hierarchy can't drift
        // per section. The display sizes are fluid (clamp) rather than stepped per breakpoint.
        // Never use the `text-token/leading` modifier form on these — Tailwind drops the tracking
        // and weight on that path; use `leading-*` if a one-off line-height is needed.
        'display-1': ['clamp(2.5rem, 1.55rem + 3.2vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-2': ['clamp(1.875rem, 1.3rem + 1.9vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-3': ['clamp(1.625rem, 1.2rem + 1.4vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'heading-2': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-3': ['1.25rem', { lineHeight: '1.35', letterSpacing: '0', fontWeight: '600' }],
        'heading-4': ['1.0625rem', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '600' }],
        lead: ['clamp(1.0625rem, 0.98rem + 0.35vw, 1.25rem)', { lineHeight: '1.5' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.55' }],
        body: ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.9375rem', { lineHeight: '1.5' }],
        caption: ['0.8125rem', { lineHeight: '1.45' }],
        label: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
        price: ['1.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        button: ['0.9375rem', { lineHeight: '1.25', letterSpacing: '-0.005em', fontWeight: '500' }],
        'button-lg': ['1rem', { lineHeight: '1.25', letterSpacing: '-0.005em', fontWeight: '500' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 hsl(220 43% 11% / 0.04), 0 1px 3px 0 hsl(220 43% 11% / 0.06)',
        popover: '0 8px 24px -4px hsl(220 43% 11% / 0.12), 0 2px 8px -2px hsl(220 43% 11% / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
      },
    },
  },
  plugins: [],
};
