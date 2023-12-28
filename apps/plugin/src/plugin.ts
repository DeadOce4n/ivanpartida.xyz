import type { NvimPlugin } from 'neovim';
import { simpleGit, type SimpleGit } from 'simple-git';
import { WebSocket } from 'ws';
import { encode } from '@msgpack/msgpack';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { mkdirp } from 'mkdirp';

import { fileExists, getFileInfo, getRemoteUrl } from './utils.ts';

const MAX_CONNECT_RETRIES = 10;

export class Plugin {
  private git?: SimpleGit;
  private ws?: WebSocket;
  private wsUri?: string;
  private password?: string;
  private cwd?: string;
  private timer?: ReturnType<typeof setInterval>;
  private retries = 0;

  constructor(private readonly plugin: NvimPlugin) {}

  public async connect() {
    if (this.wsUri && this.password) {
      if (this.ws) {
        this.ws.close();
      } else {
        this.ws = new WebSocket(this.wsUri, {
          family: 4,
        })
          .on('error', async (e) => {
            await this.plugin.nvim.errWriteLine(e.message);
            if (this.ws) {
              this.ws.removeAllListeners();
              this.ws = undefined;
            }
            if (this.timer) {
              clearInterval(this.timer);
              this.timer = undefined;
            }
          })
          .on('open', async () => {
            await this.plugin.nvim.outWriteLine('WS Connected!');
            this.ws!.send(
              encode({ hostname: os.hostname(), password: this.password }),
            );
            if (this.timer) {
              clearInterval(this.timer);
              this.timer = undefined;
            }
          })
          .on('close', () => {
            if (!this.timer) {
              this.timer = setInterval(() => {
                if (this.retries < MAX_CONNECT_RETRIES) {
                  this.retries++;
                  this.connect();
                } else if (this.timer) {
                  clearInterval(this.timer);
                }
              }, 1000);
            }
          });
      }
    } else {
      let message = '';
      if (!this.wsUri) message += 'g:portfolio_ws_uri is not set! ';
      if (!this.password) message += 'g:portfolio_ws_password is not set!';
      await this.plugin.nvim.errWriteLine(message);
    }
  }

  public async disconnect() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = undefined;
      await this.plugin.nvim.outWriteLine('WS Disconnected.');
    } else {
      await this.plugin.nvim.errWriteLine('WS already disconnected!');
    }
  }

  public async onVimEnter() {
    const configPath = path.join(
      await this.plugin.nvim.callFunction('stdpath', ['cache']),
      'portfolio',
    );

    const isDir = await fileExists({ path: configPath, directory: true });

    if (!isDir) {
      await mkdirp(configPath);
    }

    const configExists = await fileExists({
      path: path.join(configPath, 'config.json'),
    });

    if (!configExists) {
      await fs.writeFile(
        path.join(configPath, 'config.json'),
        JSON.stringify({}),
        'utf8',
      );
    }

    const rawConfig = await fs.readFile(
      path.join(configPath, 'config.json'),
      'utf8',
    );

    const config = JSON.parse(rawConfig) as {
      uri?: string;
      password?: string;
    }; // dangerous!

    const uri =
      config.uri ??
      ((await this.plugin.nvim.callFunction('input', [
        'Enter the URI of the portfolio server: ',
      ])) as string);

    const password =
      config.password ??
      ((await this.plugin.nvim.callFunction('inputsecret', [
        'Enter the password for the portfolio server: ',
      ])) as string);

    await fs.writeFile(
      path.join(configPath, 'config.json'),
      JSON.stringify({ uri, password }),
      'utf8',
    );

    const cwd = await this.plugin.nvim.callFunction('getcwd');

    this.cwd = cwd;
    this.git = simpleGit();

    await this.git.cwd(cwd);

    if (
      typeof uri === 'string' &&
      (uri.startsWith('ws://') || uri.startsWith('wss://'))
    ) {
      this.wsUri = uri;
    } else {
      await this.plugin.nvim.errWriteLine(
        'g:portfolio_ws_uri should be a valid URI!',
      );
      return;
    }

    if (typeof password !== 'string') {
      await this.plugin.nvim.errWriteLine(
        'g:portfolio_ws_password should be a string!',
      );
      return;
    }

    this.password = password;
    await this.connect();
  }

  public async onVimLeave() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
    }
  }

  public async onDirChanged() {
    this.cwd = (await this.plugin.nvim.callFunction('getcwd')) as string;
    if (this.git) {
      await this.git.cwd(this.cwd);
    }
  }

  public async onBufEnter() {
    if (this.ws && this.git && this.cwd) {
      const buffer = await this.plugin.nvim.buffer;
      const { filename, filetype } = await getFileInfo(buffer, this.cwd);
      const isRepo = await this.git.checkIsRepo();
      const remoteUrl = isRepo ? await getRemoteUrl(this.git) : null;
      const baseDir = this.cwd!.split(path.sep).at(-1)!;

      this.ws.send(
        encode({
          filename,
          filetype,
          remoteUrl,
          isRepo,
          baseDir,
        }),
      );
    }
  }

  public async send(args: string[]) {
    if (this.ws) {
      this.ws.send(encode({ msg: args[0] }));
    } else {
      await this.plugin.nvim.errWriteLine('WS not connected! Run :WSConnect');
    }
  }
}
