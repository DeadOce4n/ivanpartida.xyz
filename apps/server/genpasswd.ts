import argon2 from 'argon2';
import { parseArgs } from 'node:util';
import os from 'node:os';

import { db } from './src/db';

const { values } = parseArgs({
  options: {
    hostname: {
      type: 'string',
      short: 'h',
      default: os.hostname(),
    },
    password: {
      type: 'string',
      short: 'p',
    },
  },
});

const { hostname, password } = values;

try {
  if (!password) {
    throw new Error('Password is required');
  }

  await db.open();
  await db.put(hostname!, await argon2.hash(password));

  console.log('Hostname and password saved to db');
} catch (e) {
  console.error(e);
  process.exit(1);
}
