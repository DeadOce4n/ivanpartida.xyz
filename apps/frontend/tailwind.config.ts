import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        blue: '#7E9CD8',
        'blue-invert': '#2F549D',
        purple: '#A67DE8',
        'purple-invert': '#664794',
        'purple-light': '#9E81D8',
        'purple-light-invert': '#7D5FAB',
        pink: '#D27E99',
        'pink-invert': '#A63A69',
        orange: '#FFA066',
        'orange-invert': '#A0401C',
        red: '#FF5D62',
        'red-invert': '#BD0006',
        green: '#98BB6C',
        'green-invert': '#296B2A',
        yellow: '#E6C384',
        'yellow-invert': '#6B5F00',
        'gray-dark': '#16161D',
        'gray-dark-invert': '#E7E7EE',
        gray: '#1F1F28',
        'gray-invert': '#DBDBE6',
        'gray-light': '#2A2A37',
        'gray-light-invert': '#CFCFDE',
        'gray-lighter': '#363646',
        'gray-lighter-invert': '#C2C2D6',
        white: '#DCD7BA',
        'white-invert': '#1F1F28',
        'white-dark': '#C8C093',
        'white-dark-invert': '#4C4C6B',
      },
      fontFamily: {
        sans: ['DM Sans Variable', ...defaultTheme.fontFamily.sans],
      },
      typography: ({
        theme,
      }: {
        theme: (path: string) => Record<string, unknown>;
      }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.white'),
            '--tw-prose-headings': theme('colors.purple'),
            '--tw-prose-bold': theme('colors.orange'),
            '--tw-prose-links': theme('colors.pink'),
            '--tw-prose-code': theme('colors.green'),
            '--tw-prose-invert-body': theme('colors.white-invert'),
            '--tw-prose-invert-headings': theme('colors.purple-invert'),
            '--tw-prose-invert-bold': theme('colors.orange-invert'),
            '--tw-prose-invert-links': theme('colors.pink-invert'),
            '--tw-prose-invert-code': theme('colors.green-invert'),
          },
        },
      }),
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
      },
    },
  },
  plugins: [typography],
  darkMode: 'class',
} satisfies Config;
