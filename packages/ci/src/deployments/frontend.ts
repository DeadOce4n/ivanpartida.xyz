import type { CacheVolume, Client } from '@dagger.io/dagger';
import { DeployError, getDockerIgnore } from '@/utils.ts';
import { devDependencies } from '@/../../../package.json';

const BASE_IMAGE = 'node:18-bookworm-slim';
const EXCLUDE = await getDockerIgnore({ packageName: 'frontend' });

export const deploy = async (client: Client, cache: CacheVolume) => {
  try {
    const builder = await client
      .container()
      .from(BASE_IMAGE)
      .withMountedCache('/tmp/.pnpm-store', cache)
      .withWorkdir('/app')
      .withExec([
        'npm',
        'i',
        '-g',
        `turbo@${devDependencies.turbo.replace('^', '')}`,
      ])
      .withExec(['corepack', 'enable'])
      .withExec(['corepack', 'prepare', 'pnpm@latest-8', '--activate'])
      .withExec(['pnpm', 'config', 'set', 'store-dir', '/tmp/.pnpm-store'])
      .withMountedDirectory(
        '.',
        client.host().directory('.', {
          exclude: EXCLUDE,
        }),
      )
      .withExec(['npm', 'i', '-g', 'wrangler'])
      .withExec(['turbo', 'prune', 'frontend'])
      .withExec(['pnpm', 'install', '--frozen-lockfile'])
      .withExec(['pnpm', '--filter=frontend', 'build'])
      .withEnvVariable('CLOUDFLARE_API_TOKEN', process.env.CLOUDFLARE_API_TOKEN)
      .withEnvVariable(
        'CLOUDFLARE_ACCOUNT_ID',
        process.env.CLOUDFLARE_ACCOUNT_ID,
      )
      .withExec([
        'wrangler',
        'pages',
        'deploy',
        'apps/frontend/dist',
        '--project-name=portfolio',
      ])
      .sync();

    console.log(await builder.stdout());
  } catch (e) {
    throw new DeployError(
      e instanceof Error ? e.message : 'Unknown error',
      'frontend',
    );
  }
};
