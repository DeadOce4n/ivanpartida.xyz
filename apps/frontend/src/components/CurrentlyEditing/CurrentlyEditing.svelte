<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { decode } from '@msgpack/msgpack';
  import Git from 'icons:svelte/simple-icons/git';
  import Neovim from 'icons:svelte/simple-icons/neovim';
  import Radar from 'icons:svelte/mingcute/radar-fill';
  import FolderFill from 'icons:svelte/mingcute/folder-2-fill';
  import Sleep from 'icons:svelte/mingcute/sleep-fill';

  import { icons } from './icons';

  let socket: WebSocket;
  let timer: ReturnType<typeof setInterval> | null;
  let file: {
    filename: string;
    filetype: string;
    remoteUrl: string | null;
    isRepo: boolean;
    baseDir: string;
  } | null;

  onMount(() => {
    const connect = () => {
      if (socket) {
        socket.close();
      }
      console.log(import.meta.env.PUBLIC_WEBSOCKET_URI);
      socket = new WebSocket(import.meta.env.PUBLIC_WEBSOCKET_URI);
      socket.onopen = () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        console.log('WS Connected!');
        file = null;
      };
      socket.onclose = () => {
        if (!timer) {
          timer = setInterval(connect, 1000);
        }
      };
      socket.onmessage = async (event: MessageEvent<Blob>) => {
        const data = decode(await event.data.arrayBuffer()) as typeof file;
        file = data;
      };
    };
    connect();
  });

  onDestroy(() => {
    if (socket) {
      socket.close();
    }
  });

  $: icon = icons[file?.filetype ?? 'default']?.icon ?? icons.default.icon;
  $: iconColorClass =
    icons[file?.filetype ?? 'default']?.colorClass ?? icons.default.colorClass;
</script>

<div
  class="bg-gray flex w-full flex-col gap-4 rounded-xl p-4 shadow-md md:p-6"
  id="currently-editing"
>
  <div class="flex flex-row items-center gap-2">
    <Neovim class="text-green text-lg" />
    <span class="text-sm font-bold">Currently editing:</span>
    <span class="ml-auto flex flex-row items-center justify-center gap-1">
      {#if file}
        <span class="text-xs">Live</span>
        <Radar class="text-green" />
      {:else}
        <span class="text-xs">Offline</span>
        <Sleep class="text-blue ml-auto" />
      {/if}
    </span>
  </div>
  {#if file}
    <div class="flex flex-col gap-2 px-4">
      <div class="flex flex-row items-center gap-2">
        {#if file.isRepo}
          <Git class="text-red" />
        {:else}
          <FolderFill />
        {/if}
        <svelte:element
          this={file.remoteUrl ? 'a' : 'span'}
          href={file.remoteUrl}
          target={file.remoteUrl ? '_blank' : null}
        >
          {file.baseDir}
        </svelte:element>
      </div>
      <div
        class="
          before:from-gray-light
          relative
          flex
          w-full
          flex-row
          items-center
          gap-2
          whitespace-nowrap
          before:absolute
          before:right-0
          before:top-0
          before:h-full
          before:w-6
          before:bg-gradient-to-l
          before:to-transparent
          before:content-['']
          "
      >
        <svelte:component this={icon} class={iconColorClass} />
        <div
          class="scrollbar-hide w-full overflow-x-scroll hover:overflow-x-scroll md:overflow-x-hidden"
        >
          <span class="pr-8">{file.filename}</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="px-4">
      I'm not editing anything right now, come back later to see what I'm up to <strong
        >in real time</strong
      >!
    </div>
  {/if}
</div>
