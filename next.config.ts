import withBundleAnalyzer from '@next/bundle-analyzer';
import { type NextConfig } from 'next';

import { env } from './env.mjs';

const nextConfig: NextConfig = {
  /* Enable React Strict Mode */
  reactStrictMode: true,

  /* Eslint config */
  eslint: {
    // ✅ disable build-time linting (we enforce elsewhere)
    ignoreDuringBuilds: true,
    // optional: explicitly tell Next which dirs to lint if you re-enable
    dirs: ['src'],
  },

  /* Config option for allowed origin regarding CORS concern */
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1', // Playwright uses this
  ],

  /*
    Config option for optimizing package imports.
    This will only load the modules that are actually use in the app

    https://nextjs.org/docs/advanced-features/optimizing-packages

    Uncomment the line below and provide the package name you want to optimize
  */
  // optimizePackageImports: [],

  /*
    Config option for remote access of external files

    https://nextjs.org/docs/app/getting-started/images

    Uncomment the line below and provide the config details of the remote access
  */
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'placehold.co',
  //       port: '',
  //       pathname: '/**',
  //     },
  //   ],
  // },
};

export default env.ANALYZE ? withBundleAnalyzer({ enabled: env.ANALYZE })(nextConfig) : nextConfig;
