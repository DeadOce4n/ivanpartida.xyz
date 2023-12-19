<script lang="ts">
  import Moon from 'icons:svelte/mingcute/moon-stars-fill';
  import Sun from 'icons:svelte/mingcute/sun-fill';
  import { onMount } from 'svelte';
  import { cn } from '@/utils';

  let light = false;

  let html: HTMLHtmlElement | null = null;
  let localStorage: Storage | null = null;

  let loading = true;

  onMount(() => {
    html = document.documentElement as HTMLHtmlElement;
    localStorage = window.localStorage;

    if (localStorage) {
      const storedMode = localStorage.getItem('light');

      if (
        storedMode === '1' ||
        (storedMode === null &&
          !window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        light = true;
      }
    }

    loading = false;
  });

  const toggleLightMode = () => {
    light = !light;

    light ? html?.classList.add('dark') : html?.classList.remove('dark');

    if (localStorage) {
      localStorage.setItem('light', light ? '1' : '0');
    }
  };

  let className = '';

  export { className as class };
</script>

<button
  on:click={toggleLightMode}
  class={cn(
    'dark:hover:bg-white-dark-invert dark:text-white-dark-invert rounded-full p-2 text-2xl text-white transition-colors hover:bg-white hover:bg-opacity-10 dark:hover:bg-opacity-10',
    loading &&
      'text-gray-lighter dark:text-gray-lighter-invert cursor-not-allowed',
    className,
  )}
  disabled={loading}
  aria-label="Toggle light mode"
>
  {#if light}<Sun />{:else}<Moon />{/if}
</button>
