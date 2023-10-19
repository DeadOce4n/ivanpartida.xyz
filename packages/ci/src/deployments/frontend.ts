import type { Client } from '@dagger.io/dagger';

// @ts-expect-error this will be implemented later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deploy = async (client: Client) => {
  throw new Error('Deployment stage implementation pending for frontend', {
    cause: 'frontend',
  });
};
