import esbuild, { type BuildOptions } from 'esbuild';
import { parseArgs } from 'node:util';

async function main() {
  const { values } = parseArgs({
    options: {
      watch: {
        type: 'boolean',
        short: 'w',
      },
    },
  });

  const options = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    packages: 'external',
    outdir: './dist',
    format: 'cjs',
    logLevel: 'info',
  } satisfies BuildOptions;

  if (values.watch) {
    const ctx = await esbuild.context(options);

    const exitHandler = async () => {
      await ctx.dispose();
      process.exit(0);
    };

    process.on('SIGINT', exitHandler);
    process.on('SIGQUIT', exitHandler);
    process.on('SIGTERM', exitHandler);

    await ctx.watch();
  } else {
    await esbuild.build(options);
  }
}

main();
