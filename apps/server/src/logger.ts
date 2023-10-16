import { pino, type LoggerOptions } from 'pino';
import { env } from '@/env.ts';

const options: LoggerOptions = {};

if (env.NODE_ENV === 'development') {
  options.level = 'debug';
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
} else {
  options.level = env.LOG_LEVEL;
}

export const logger = pino(options);
