import type { NvimPlugin } from 'neovim';
import WebSocket from 'ws';
import { encode } from '@msgpack/msgpack';
import path from 'node:path';
import os from 'node:os';

import { getFileInfo, getRemoteUrl } from './utils/strings';

export default async function (plugin: NvimPlugin) {
  let socket: WebSocket | null = null;
  let timer: NodeJS.Timeout | null = null;
  let retries = 0;

  const MAX_CONNECT_RETRIES = 10;

  let WS_URI: string | undefined;
  let password: string | undefined;

  const connect = async () => {
    if (WS_URI && password) {
      if (socket) {
        socket.close();
      } else {
        socket = new WebSocket(WS_URI, {
          family: 4,
        })
          .on('error', async (e) => {
            await plugin.nvim.errWriteLine(e.message);
            if (socket) {
              socket.removeAllListeners();
              socket = null;
            }
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          })
          .on('open', async () => {
            await plugin.nvim.outWriteLine('WS Connected!');
            socket!.send(encode({ hostname: os.hostname(), password }));
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          })
          .on('close', () => {
            if (!timer) {
              timer = setInterval(() => {
                if (retries < MAX_CONNECT_RETRIES) {
                  retries++;
                  connect();
                } else if (timer) {
                  clearInterval(timer);
                }
              }, 1000);
            }
          });
      }
    } else {
      let message = '';
      if (!WS_URI) message += 'g:portfolio_ws_uri is not set! ';
      if (!password) message += 'g:portfolio_ws_password is not set!';
      await plugin.nvim.errWriteLine(message);
    }
  };

  let cwd: string;

  plugin.registerAutocmd(
    'VimEnter',
    async () => {
      const uriFromConfig = await plugin.nvim.getVar('portfolio_ws_uri');
      cwd = await plugin.nvim.callFunction('getcwd');

      if (
        typeof uriFromConfig === 'string' &&
        (uriFromConfig.startsWith('ws://') ||
          uriFromConfig.startsWith('wss://'))
      ) {
        WS_URI = uriFromConfig;
      } else {
        await plugin.nvim.errWriteLine(
          'g:portfolio_ws_uri should be a valid URI!',
        );
        return;
      }

      const passwordFromConfig = await plugin.nvim.getVar(
        'portfolio_ws_password',
      );

      if (typeof passwordFromConfig !== 'string') {
        await plugin.nvim.errWriteLine(
          'g:portfolio_ws_uri should be a valid URI!',
        );
        return;
      }

      password = passwordFromConfig;
      await connect();
    },
    { pattern: '*' },
  );

  plugin.registerAutocmd(
    'VimLeave',
    async () => {
      if (socket) {
        socket.removeAllListeners();
        socket.close();
      }
    },
    { pattern: '*' },
  );

  plugin.registerCommand('WSConnect', connect, { sync: false });
  plugin.registerCommand(
    'WSDisconnect',
    async () => {
      if (socket) {
        socket.removeAllListeners();
        socket.close();
        socket = null;
        await plugin.nvim.outWriteLine('WS Disconnected.');
      } else {
        await plugin.nvim.errWriteLine('WS already disconnected!');
      }
    },
    { sync: false },
  );

  plugin.registerCommand(
    'WSSend',
    async (args: string[]) => {
      if (socket) {
        socket.send(encode({ msg: args[0] }));
      } else {
        await plugin.nvim.errWriteLine('WS not connected! Run :WSConnect');
      }
    },
    { sync: false, nargs: '1' },
  );

  plugin.registerAutocmd(
    'DirChanged',
    async () => {
      cwd = (await plugin.nvim.callFunction('getcwd')) as string;
    },
    { pattern: '*' },
  );

  plugin.registerAutocmd(
    'BufEnter',
    async () => {
      if (socket) {
        const buffer = await plugin.nvim.buffer;

        const { filename, filetype } = await getFileInfo(buffer, cwd);

        const isRepo =
          (await plugin.nvim.commandOutput(
            'Git rev-parse --is-inside-work-tree',
          )) === 'true';

        const remoteUrl = isRepo ? await getRemoteUrl(plugin) : null;

        const baseDir = cwd.split(path.sep).at(-1)!;

        socket.send(
          encode({
            filename,
            filetype,
            remoteUrl,
            isRepo,
            baseDir,
          }),
        );
      }
    },
    { pattern: '*' },
  );
}
