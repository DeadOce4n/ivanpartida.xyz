import type { CacheVolume, Client } from '@dagger.io/dagger';
import {
  KubeConfig,
  KubernetesObjectApi,
  type V1Deployment,
} from '@kubernetes/client-node';
import YAML from 'yaml';
import { randomUUID } from 'node:crypto';

import { devDependencies } from '@/../../../package.json';
import { yaml, getDockerIgnore, DeployError } from '@/utils.ts';

const BASE_IMAGE = 'node:18-bookworm-slim';
const EXCLUDE = await getDockerIgnore({ packageName: 'server' });

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
      .withExec(['turbo', 'prune', 'server', '--docker'])
      .sync();

    const installer = await client
      .container()
      .from(BASE_IMAGE)
      .withMountedCache('/tmp/.pnpm-store', cache)
      .withWorkdir('/app')
      .withExec(['corepack', 'enable'])
      .withExec(['corepack', 'prepare', 'pnpm@latest-8', '--activate'])
      .withExec(['pnpm', 'config', 'set', 'store-dir', '/tmp/.pnpm-store'])
      .withFile('.gitignore', client.host().file('.gitignore'))
      .withDirectory('.', builder.directory('/app/out/json'))
      .withFile('pnpm-lock.yaml', builder.file('/app/out/pnpm-lock.yaml'))
      .withExec(['pnpm', 'install', '--frozen-lockfile'])
      .withDirectory('.', builder.directory('/app/out/full'), {
        exclude: EXCLUDE,
      })
      .withExec(['turbo', 'run', 'build', '--filter=server'])
      .sync();

    const runner = await client
      .container()
      .from(BASE_IMAGE)
      .withMountedCache('/tmp/.pnpm-store', cache)
      .withWorkdir('/app')
      .withDirectory('.', installer.directory('/app'), {
        owner: 'node',
        exclude: EXCLUDE,
      })
      .withExec(['corepack', 'enable'])
      .withExec(['corepack', 'prepare', 'pnpm@latest-8', '--activate'])
      .withExec(['pnpm', 'config', 'set', 'store-dir', '/tmp/.pnpm-store'])
      .withEnvVariable('CI', 'true')
      .withUser('node')
      .withExec(['pnpm', 'install', '--prod', '--frozen-lockfile'])
      .withEntrypoint(['pnpm', '--filter=server', 'start'])
      .sync();

    const imageRef = await runner.publish(
      `ttl.sh/portfolio-server-${randomUUID()}:10m`,
    );

    const kubeConfig = new KubeConfig();

    kubeConfig.loadFromClusterAndUser(
      {
        name: 'suprachat',
        server: process.env.KUBE_CLUSTER_HOST,
        caData: process.env.KUBE_CA_DATA,
        skipTLSVerify: false,
      },
      {
        name: 'suprachat',
        certData: process.env.KUBE_CERT_DATA,
        keyData: process.env.KUBE_KEY_DATA,
      },
    );

    const kubeClient = KubernetesObjectApi.makeApiClient(kubeConfig);
    const deploymentYaml = getDeploymentYaml(imageRef);
    const manifest = YAML.parseDocument(deploymentYaml).toJS() as V1Deployment;

    try {
      await kubeClient.patch(manifest);
    } catch (e) {
      console.warn(`Deployment doesn't exist, gotta create it...`);

      await kubeClient.create(manifest);

      console.log('Succesfully deployed new image!');
    }
  } catch (e) {
    throw new DeployError(
      e instanceof Error ? e.message : 'Unknown error',
      'server',
    );
  }
};

function getDeploymentYaml(image: string) {
  return yaml`
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portfolio-ws
  namespace: portfolio
spec:
  replicas: 1
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: portfolio-ws
  template:
    metadata:
      labels:
        app: portfolio-ws
    spec:
      containers:
        - name: portfolio-ws
          image: ${image}
          ports:
            - name: web
              containerPort: 9001
          envFrom:
            - configMapRef:
                name: portfolio-ws-env
          volumeMounts:
            - name: portfolio-ws-storage
              mountPath: /app/apps/server/db
      securityContext:
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
      volumes:
        - name: portfolio-ws-storage
          persistentVolumeClaim:
            claimName: portfolio-ws-storage
`;
}
