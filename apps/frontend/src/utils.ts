import { cx } from 'classix';
import { twMerge } from 'tailwind-merge';

export const cn = (...args: Parameters<typeof cx>) => twMerge(cx(...args));
