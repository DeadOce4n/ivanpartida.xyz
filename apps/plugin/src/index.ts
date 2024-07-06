import type { NvimPlugin } from 'neovim';

import { Plugin } from './plugin';

export default async function (p: NvimPlugin) {
  let plugin: Plugin; // eslint-disable-line prefer-const

  p.registerAutocmd('VimEnter', () => plugin.onVimEnter(), { pattern: '*' });
  p.registerAutocmd('VimLeave', () => plugin.onVimLeave(), { pattern: '*' });
  p.registerAutocmd('DirChanged', () => plugin.onDirChanged(), {
    pattern: '*',
  });
  p.registerAutocmd('BufEnter', () => plugin.onBufEnter(), { pattern: '*' });

  p.registerCommand('WSConnect', () => plugin.connect(), { sync: false });
  p.registerCommand('WSDisconnect', () => plugin.disconnect(), { sync: false });
  p.registerCommand('WSReconnect', () => plugin.reconnect(), { sync: false });
  p.registerCommand('WSSend', (args: [string]) => plugin.send(args), {
    sync: false,
    nargs: '1',
  });
  p.registerCommand(
    'WSConfigure',
    async () => {
      await plugin.configure();
      await plugin.reconnect();
    },
    {
      sync: false,
    },
  );

  plugin = new Plugin(p);
}
