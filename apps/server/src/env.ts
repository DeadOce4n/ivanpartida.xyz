import { z } from 'zod';

export const env = z
  .object({
    NODE_ENV: z.enum(['development', 'production']),
    PORT: z.coerce.number().default(9001),
    LOG_LEVEL: z
      .enum(['error', 'fatal', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
  })
  .parse(process.env);
