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

import type IconForSvelte from 'icons:svelte/not-actually-a-module';

export const icons: {
  [filetype: string]: {
    icon: typeof IconForSvelte;
    colorClass?: `text-${string}`;
  };
  default: {
    icon: typeof IconForSvelte;
    colorClass: 'text-white';
  };
} = {
  typescript: {
    icon: TypeScript,
    colorClass: 'text-blue',
  },
  typescriptreact: {
    icon: React,
    colorClass: 'text-blue',
  },
  javascript: {
    icon: JavaScript,
    colorClass: 'text-yellow',
  },
  javascriptreact: {
    icon: React,
    colorClass: 'text-blue',
  },
  astro: {
    icon: AstroIcon,
    colorClass: 'text-orange',
  },
  svelte: {
    icon: Svelte,
    colorClass: 'text-orange',
  },
  lua: {
    icon: Lua,
    colorClass: 'text-purple',
  },
  TelescopePrompt: {
    icon: Telescope,
  },
  'neo-tree': {
    icon: Directory,
  },
  fugitive: {
    icon: GitBranchFill,
  },
  json: {
    icon: Json,
    colorClass: 'text-yellow',
  },
  FTerm: {
    icon: Terminal,
  },
  default: {
    icon: FileFill,
    colorClass: 'text-white',
  },
};
