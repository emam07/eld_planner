import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg:       '#09090B',
        surface:  '#111113',
        card:     '#18181B',
        border:   '#27272A',
        muted:    '#3F3F46',
        subtle:   '#52525B',
        secondary:'#71717A',
        dim:      '#A1A1AA',
        bright:   '#FAFAFA',
        blue:     '#2563EB',
        'blue-light': '#3B82F6',
        green:    '#10B981',
        amber:    '#F59E0B',
        purple:   '#8B5CF6',
      },
    },
  },
  plugins: [],
}

export default config
