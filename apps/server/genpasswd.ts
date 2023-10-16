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

if (!password) {
  throw new Error('2 arguments required!');
}

await db.open();
await db.put(hostname!, await argon2.hash(password));

console.log('Hostname and password saved to db');
