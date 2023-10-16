import { defineConfig } from 'astro/config';
import Icons from 'unplugin-icons/vite';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  vite: {
    resolve: {
      alias: [
        { find: 'icons:svelte', replacement: '~icons' },
        { find: 'icons:astro', replacement: '~icons' },
      ],
    },
    plugins: [
      Icons({
        compiler: 'svelte',
        autoInstall: true,
      }),
      Icons({
        compiler: 'astro',
        autoInstall: true,
      }),
    ],
  },
});
