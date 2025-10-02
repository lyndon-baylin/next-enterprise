import withBundleAnalyzer from '@next/bundle-analyzer';
import { type NextConfig } from 'next';

import { env } from './env.mjs';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
};

export default env.ANALYZE ? withBundleAnalyzer({ enabled: env.ANALYZE })(nextConfig) : nextConfig;
