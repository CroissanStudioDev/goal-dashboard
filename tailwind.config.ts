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
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Large sizes for TV display
        'display-sm': ['4rem', { lineHeight: '1.1' }],
        'display-md': ['6rem', { lineHeight: '1.1' }],
        'display-lg': ['8rem', { lineHeight: '1.1' }],
        'display-xl': ['12rem', { lineHeight: '1' }],
      },
      colors: {
        // Goal status colors
        goal: {
          ahead: '#22c55e',    // Green - ahead of pace
          ontrack: '#3b82f6',  // Blue - on track
          behind: '#f59e0b',   // Yellow - slightly behind
          atrisk: '#ef4444',   // Red - at risk
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
