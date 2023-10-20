import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { connect } from '@dagger.io/dagger';
import dotenv from 'dotenv';

import { getLatestSuccessfulPipeline } from '@/gitlab.ts';
import * as deployments from '@/deployments/index.ts';
import { devDependencies } from '@/../../../package.json';
import type { DeployError } from './utils.ts';

try {
  const envPath = path.resolve('./.env');
  await fs.access(envPath);
  dotenv.config({ path: envPath });
} catch (e) {
  console.log('Env file not found, skipping...');
}

connect(
  async (client) => {
    const baseImage = 'node:18-bookworm-slim';
    const nodeCache = client.cacheVolume('node');

    const pipelineSource = process.env.CI_PIPELINE_SOURCE ?? 'push';
    const targetBranch =
      process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME ?? 'main';
    const sourceBranch =
      process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME ?? 'feature';

    const latestSuccessfulPipeline = await getLatestSuccessfulPipeline(
      process.env.CI_PROJECT_PATH ?? 'DeadOcean/ivanpartida.xyz',
      process.env.CI_COMMIT_REF_NAME ?? 'main',
      process.env.CI_PIPELINE_SOURCE ?? 'push',
    );

    let filter: string[];

    if (process.env.TARGETS) {
      filter = process.env.TARGETS.split(',');
    } else if (pipelineSource === 'merge_request_event') {
      filter = [`...[${targetBranch}...${sourceBranch}]`];
    } else if (latestSuccessfulPipeline) {
      filter = [`...[HEAD^...${latestSuccessfulPipeline.commit}]`];
    } else {
      filter = ['...[HEAD^1]'];
    }

    const filterArgs = filter.map((f) => `--filter=${f}`);

    const lint = client
      .container()
      .from(baseImage)
      .withMountedCache('/tmp/.pnpm-store', nodeCache)
      .withWorkdir('/app')
      .withExec(['apt-get', '-qq', '-o=Dpkg::Use-Pty=0', 'update', '-y'])
      .withExec([
        'apt-get',
        '-qq',
        '-o=Dpkg::Use-Pty=0',
        'install',
        'openssl',
        'tree',
        'git',
        'jq',
        '-y',
      ])
      .withExec(['corepack', 'enable'])
      .withExec(['corepack', 'prepare', 'pnpm@latest-8', '--activate'])
      .withExec(['pnpm', 'config', 'set', 'store-dir', '/tmp/.pnpm-store'])
      .withMountedDirectory(
        '.',
        client.host().directory('.', {
          exclude: ['node_modules', '**/node_modules'],
        }),
      )
      .withExec([
        'npm',
        'i',
        '-g',
        `turbo@${devDependencies.turbo.replace('^', '')}`,
      ]);

    if (process.env.CI !== 'true') {
      lint
        .withFile(
          'ssh_key',
          client.host().file(path.join(os.homedir(), '.ssh', 'id_ed25519')),
          { permissions: 0o600 },
        )
        .withExec(['mkdir', '-p', '/root/.ssh'])
        .withExec([
          'bash',
          '-c',
          'ssh-keyscan -t rsa gitlab.com >> /root/.ssh/known_hosts',
        ])
        .withEnvVariable(
          'GIT_SSH_COMMAND',
          "ssh -i /app/ssh_key -F /dev/null -o 'IdentitiesOnly yes'",
        )
        .withExec(['git', 'fetch']);
    }

    await lint
      .withExec(['pnpm', 'install', '--frozen-lockfile'])
      .withExec(['turbo', 'run', 'lint', ...filterArgs])
      .withExec(['turbo', 'run', 'check', ...filterArgs])
      .sync();

    if (process.env.CI_PIPELINE_SOURCE !== 'merge_request_event') {
      console.log('Building and uploading image...');

      const affectedOutput = await lint
        .withExec(['pnpm', 'exec', 'turbo', 'run', 'affected', ...filterArgs])
        .stdout();

      const affectedApps = affectedOutput
        .split('\n')
        .filter((line) => /is-affected:[\w-_@/]+/.test(line))
        .flatMap(
          (line) => /(is-affected:([\w-_@/]+))/.exec(line)!.at(2)!,
        ) as (keyof typeof deployments)[];

      const maybeDeployed = await Promise.allSettled(
        affectedApps.map(async (app) => {
          await deployments[app](client, nodeCache);
          return app;
        }),
      );

      const deployed: string[] = [],
        notDeployed: DeployError[] = [];

      maybeDeployed.forEach((app) => {
        const status = app.status;
        if (status === 'fulfilled') {
          deployed.push(app.value);
        } else {
          const error = app.reason as DeployError;
          notDeployed.push(error);
        }
      });

      console.log('Deployed the following packages successfully:\n');

      deployed.forEach((pkg) => {
        console.log(`- ${pkg}\n`);
      });

      if (notDeployed.length > 0) {
        console.error('Deployment failed for the following packages:');

        notDeployed.forEach((pkg) => {
          console.log(`- ${pkg.packageName}`);
          console.log(`\t${pkg.message}`);
        });

        process.exit(1);
      }
    }
  },
  { LogOutput: process.stderr, Workdir: '../..' },
);
