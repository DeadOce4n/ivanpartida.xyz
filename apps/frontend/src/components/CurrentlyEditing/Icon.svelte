<script lang="ts">
  import { cva, type VariantProps } from 'class-variance-authority';
  import TypeScript from 'icons:svelte/simple-icons/typescript';
  import JavaScript from 'icons:svelte/simple-icons/javascript';
  import AstroIcon from 'icons:svelte/simple-icons/astro';
  import Svelte from 'icons:svelte/simple-icons/svelte';
  import React from 'icons:svelte/simple-icons/react';
  import Lua from 'icons:svelte/simple-icons/lua';
  import FileFill from 'icons:svelte/mingcute/file-fill';
  import Telescope from 'icons:svelte/mingcute/telescope-fill';
  import Directory from 'icons:svelte/mingcute/directory-fill';
  import GitBranchFill from 'icons:svelte/mingcute/git-branch-fill';
  import Json from 'icons:svelte/mingcute/braces-fill';
  import Terminal from 'icons:svelte/mingcute/terminal-box-fill';
  import Markdown from 'icons:svelte/simple-icons/markdown';
  import Css from 'icons:svelte/simple-icons/css3';
  import Yaml from 'icons:svelte/simple-icons/yaml';
  import Docker from 'icons:svelte/simple-icons/docker';
  import Python from 'icons:svelte/logos/python';
  import Bash from 'icons:svelte/simple-icons/gnubash';
  import Go from 'icons:svelte/simple-icons/go';
  import Rust from 'icons:svelte/simple-icons/rust';

  import type IconForSvelte from 'icons:svelte/not-actually-a-module';

  const variants = cva(null, {
    variants: {
      color: {
        normal: 'text-white dark:text-white-invert',
        orange: 'text-orange dark:text-orange-invert',
        yellow: 'text-yellow dark:text-yellow-invert',
        green: 'text-green dark:text-green-invert',
        blue: 'text-blue dark:text-blue-invert',
        purple: 'text-purple dark:text-purple-invert',
        pink: 'text-pink dark:text-pink-invert',
      },
    },
    defaultVariants: {
      color: 'normal',
    },
  });

  const icons: {
    [key: string]: {
      icon: typeof IconForSvelte;
      color?: VariantProps<typeof variants>['color'];
    };
    default: {
      icon: typeof IconForSvelte;
      color: VariantProps<typeof variants>['color'];
    };
  } = {
    typescript: { icon: TypeScript, color: 'blue' },
    typescriptreact: { icon: React, color: 'blue' },
    javascript: { icon: JavaScript, color: 'yellow' },
    javascriptreact: { icon: React, color: 'blue' },
    astro: { icon: AstroIcon, color: 'orange' },
    svelte: { icon: Svelte, color: 'orange' },
    lua: { icon: Lua, color: 'purple' },
    TelescopePrompt: { icon: Telescope },
    'neo-tree': { icon: Directory },
    fugitibe: { icon: GitBranchFill },
    json: { icon: Json, color: 'yellow' },
    FTerm: { icon: Terminal },
    markdown: { icon: Markdown },
    css: { icon: Css, color: 'blue' },
    yaml: { icon: Yaml },
    dockerfile: { icon: Docker, color: 'blue' },
    python: { icon: Python, color: 'yellow' },
    sh: { icon: Bash },
    go: { icon: Go, color: 'blue' },
    rust: { icon: Rust },
    default: { icon: FileFill, color: 'normal' },
  };

  export let filetype: string;

  $: icon = icons[filetype] ?? icons.default;
</script>

<svelte:component this={icon.icon} class={variants({ color: icon.color })} />
