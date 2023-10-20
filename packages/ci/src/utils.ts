import fs from 'node:fs/promises';
import { join } from 'node:path';
import { EOL } from 'node:os';
import type { PackageJson } from 'type-fest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const yaml = (string: TemplateStringsArray, ...values: any[]) =>
  String.raw({ raw: string }, ...values);

async function findDockerIgnorePath(
  startDir: string,
  packageName: string,
): Promise<string | null> {
  const files = await fs.readdir(startDir);

  if (files.includes('package.json')) {
    const packageJsonContent = await fs.readFile(
      join(startDir, 'package.json'),
      'utf8',
    );
    const packageJson = JSON.parse(packageJsonContent) as PackageJson;

    if (packageJson.name === packageName && files.includes('.dockerignore')) {
      return join(startDir, '.dockerignore');
    }
  }

  for (const file of files) {
    const filePath = join(startDir, file);
    const fileStat = await fs.stat(filePath);

    if (fileStat.isDirectory()) {
      const dockerIgnorePath = await findDockerIgnorePath(
        filePath,
        packageName,
      );
      if (dockerIgnorePath) {
        return dockerIgnorePath;
      }
    }
  }

  return null;
}

type GetDockerIgnoreParams = { packageName: string };

export const getDockerIgnore = async ({
  packageName,
}: GetDockerIgnoreParams) => {
  const dockerIgnorePath = await findDockerIgnorePath(
    join(process.cwd(), '..', '..'),
    packageName,
  );

  if (!dockerIgnorePath) {
    return undefined;
  }

  return fs.readFile(dockerIgnorePath).then((file) =>
    file
      .toString()
      .split(EOL)
      .filter((pattern) => !!pattern && !pattern.startsWith('#'))
      .map((pattern) => `**/${pattern}`),
  );
};

export class DeployError extends Error {
  constructor(
    message: string,
    public readonly packageName: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this);
  }
}
