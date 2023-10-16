import { TextDecoder } from 'node:util';
import { customAlphabet } from 'nanoid';
import { alphanumeric } from 'nanoid-dictionary';

export const arrayBufferToString = (input: ArrayBuffer) =>
  new TextDecoder('utf-8').decode(new Uint8Array(input));

export const nanoid = customAlphabet(alphanumeric, 10);
