import type { Buffer } from 'neovim';
import path from 'node:path';
import type { SimpleGit } from 'simple-git';
import fs from 'node:fs/promises';

export const getRemoteUrl = async (git: SimpleGit) => {
  const maybeRemoteUrl = await git
    .getRemotes(true)
    .then((remotes) => remotes.find((remote) => remote.name === 'origin'))
    .then((origin) => {
      if (origin) {
        return origin.refs.fetch;
      }
      return 'fatal:';
    });

  let remoteUrl: string | null = null;

  if (
    !maybeRemoteUrl.startsWith('error:') &&
    !maybeRemoteUrl.startsWith('fatal:')
  ) {
    if (maybeRemoteUrl.startsWith('git@')) {
      remoteUrl = `https://${maybeRemoteUrl
        .replace('git@', '')
        .replace(':', '/')}`;
    } else {
      remoteUrl = `https://${maybeRemoteUrl}`;
    }
  }

  return remoteUrl;
};

export const getFileInfo = async (buffer: Buffer, cwd: string) => {
  let filename = (await Promise.resolve(buffer.name)) || '[no name]';
  const filetype = (await buffer.getOption('filetype')) as string;

  if (filetype === 'TelescopePrompt') {
    filename = 'Browsing Telescope';
  } else if (filetype === 'fugitive') {
    filename = 'Browsing fugitive.vim';
  } else if (filetype === 'FTerm') {
    filename = 'Navigating the terminal';
  } else if (filetype === 'neo-tree') {
    filename = 'Browsing Neo-tree';
  } else if (filename.includes(cwd)) {
    filename = filename.replace(`${cwd}${path.sep}`, '');
  } else if (filename.includes(process.env.HOME)) {
    filename = filename.replace(process.env.HOME, '~');
  }

  return { filename, filetype };
};

type FileExistsParams = {
  path: string;
  directory?: boolean;
};

export const fileExists = async ({
  path,
  directory = false,
}: FileExistsParams) =>
  fs
    .stat(path)
    .then((stat) => (directory ? stat.isDirectory() : stat.isFile()))
    .catch(() => false);
