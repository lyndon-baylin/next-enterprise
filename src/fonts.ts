/* eslint-disable import/no-unresolved */
// src/fonts.ts
// Centralized font imports for Next.js virtual fonts
// https://nextjs.org/docs/app/building-your-application/optimizing/fonts

import { GeistMono as GeistMonoFont } from 'geist/font/mono';
import { GeistSans as GeistSansFont } from 'geist/font/sans';

export const GeistSans = {
  variable: '--font-geist-sans',
  font: GeistSansFont({
    subsets: ['latin'],
    weight: ['400', '700'],
    display: 'swap',
    variable: '--font-geist-sans',
  }),
};

export const GeistMono = {
  variable: '--font-geist-mono',
  font: GeistMonoFont({
    subsets: ['latin'],
    weight: ['400'],
    display: 'swap',
    variable: '--font-geist-mono',
  }),
};
