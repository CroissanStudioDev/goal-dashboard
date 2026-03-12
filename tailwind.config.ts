import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-sm': ['4rem', { lineHeight: '1.1' }],
        'display-md': ['6rem', { lineHeight: '1.1' }],
        'display-lg': ['8rem', { lineHeight: '1.1' }],
        'display-xl': ['12rem', { lineHeight: '1' }],
      },
      colors: {
        // Semantic colors referencing CSS variables
        bg: {
          DEFAULT: 'var(--color-bg)',
          elevated: 'var(--color-bg-elevated)',
          muted: 'var(--color-bg-muted)',
          subtle: 'var(--color-bg-subtle)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          muted: 'var(--color-border-muted)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          text: 'var(--color-primary-text)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          text: 'var(--color-success-text)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          text: 'var(--color-warning-text)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          text: 'var(--color-danger-text)',
        },
        goal: {
          ahead: 'var(--color-goal-ahead)',
          'ahead-text': 'var(--color-goal-ahead-text)',
          ontrack: 'var(--color-goal-ontrack)',
          'ontrack-text': 'var(--color-goal-ontrack-text)',
          behind: 'var(--color-goal-behind)',
          'behind-text': 'var(--color-goal-behind-text)',
          atrisk: 'var(--color-goal-atrisk)',
          'atrisk-text': 'var(--color-goal-atrisk-text)',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
