import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        blue: '#7E9CD8',
        purple: '#957FB8',
        'purple-light': '#9E81D8',
        pink: '#D27E99',
        orange: '#FFA066',
        red: '#FF5D62',
        green: '#98BB6C',
        yellow: '#E6C384',
        'gray-dark': '#16161D',
        gray: '#1F1F28',
        'gray-light': '#2A2A37',
        'gray-lighter': '#363646',
        white: '#DCD7BA',
        'white-dark': '#C8C093',
      },
      fontFamily: {
        sans: ['DM Sans Variable', ...defaultTheme.fontFamily.sans],
        mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
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
} satisfies Config;
