import { App } from 'uWebSockets.js';
import { encode, decode } from '@msgpack/msgpack';
import { z } from 'zod';
import argon2 from 'argon2';

import { env } from '@/env.ts';
import { logger } from '@/logger.ts';
import { arrayBufferToString, nanoid } from '@/utils.ts';
import { db } from './db.ts';

const app = App();

type User = {
  id?: string;
};

const loginSchema = z.object({ hostname: z.string(), password: z.string() });

const messageSchema = z.object({
  filename: z.string(),
  filetype: z.string(),
  remoteUrl: z.string().url().nullable(),
  isRepo: z.boolean(),
  baseDir: z.string(),
});

await db.open();

app
  .ws<User>('/*', {
    open: (ws) => {
      logger.debug(
        `New connection: | ${arrayBufferToString(ws.getRemoteAddressAsText())}`,
      );
      ws.subscribe('to_frontend');
    },
    message: (ws, message) => {
      const userData = ws.getUserData();
      logger.info(userData.id);
      if (!userData.id) {
        const { hostname, password } = loginSchema.parse(decode(message));
        db.get(hostname)
          .then((hash) =>
            argon2.verify(hash, password).then((result) => {
              if (result) {
                userData.id = `${hostname}-${nanoid()}`;
                logger.info(`Successful login from ${userData.id}`);
              } else {
                logger.error(`Failed login attempt from host: ${hostname}`);
                ws.end(401);
              }
            }),
          )
          .catch(() => {
            logger.error(`Access attempt from unknown host: ${hostname}`);
            ws.end(401);
          });
      } else {
        try {
          const msg = messageSchema.parse(decode(message));
          logger.info({ id: ws.getUserData().id, message: msg });
          ws.publish('to_frontend', encode(msg), true);
        } catch (e) {
          if (e instanceof Error) {
            logger.error(e.message);
          } else {
            logger.error('Unknown error!');
          }
          ws.end();
        }
      }
    },
  })
  .any('/*', (res, _req) => {
    res.end('Nothing to see here!');
  })
  .listen(env.PORT, (token) => {
    if (!token) {
      logger.error('Connection error!');
      process.exit(1);
    } else {
      logger.info(`Server listening on port ${env.PORT}`);
    }
  });
