import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
