<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { decode } from '@msgpack/msgpack';
  import Git from 'icons:svelte/simple-icons/git';
  import Radar from 'icons:svelte/mingcute/radar-fill';
  import FolderFill from 'icons:svelte/mingcute/folder-2-fill';
  import Sleep from 'icons:svelte/mingcute/sleep-fill';

  import Icon from './Icon.svelte';

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

  $: icon = file?.filetype ?? 'default';
</script>

<div
  class="border-gray-light dark:border-gray-light-invert rounded-xl border p-6 shadow-sm transition-colors"
>
  <div class="inline-flex w-full flex-row justify-between">
    <h2 class="!mt-0 inline-flex w-full flex-row justify-between">
      Currently editing
      <span
        class="dark:text-white-invert flex flex-row items-center gap-2 self-end text-white"
      >
        {#if file}
          <span class="text-xs">Live</span>
          <Radar class="dark:text-green-invert text-green" />
        {:else}
          <span class="text-xs">Offline</span>
          <Sleep class="dark:text-blue-invert text-blue ml-auto" />
        {/if}
      </span>
    </h2>
  </div>
  <div class="flex w-full flex-col gap-4 rounded-xl" id="currently-editing">
    {#if file}
      <div class="flex flex-col gap-2">
        <div class="flex flex-row items-center gap-2">
          {#if file.isRepo}
            <Git class="dark:text-red-invert text-red" />
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
          dark:before:from-gray-dark-invert
          before:from-gray-dark
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
          <Icon filetype={icon} />
          <div
            class="scrollbar-hide w-full overflow-x-scroll hover:overflow-x-scroll md:overflow-x-hidden"
          >
            <span class="pr-8">{file.filename}</span>
          </div>
        </div>
      </div>
    {:else}
      <div>
        I'm not editing anything right now, come back later to see what I'm up
        to <strong>in real time</strong>!
      </div>
    {/if}
  </div>
</div>
