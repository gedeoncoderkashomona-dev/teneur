import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ['@react-pdf/renderer', '@react-pdf/font', 'pdfkit'],
  outputFileTracingIncludes: {
    '/api/pdf/boletim': [
      './node_modules/pdfkit/js/standard-fonts/**/*',
      './node_modules/pdfkit/js/data/**/*',
    ],
    '/api/pdf/relatorio-nbr': [
      './node_modules/pdfkit/js/standard-fonts/**/*',
      './node_modules/pdfkit/js/data/**/*',
    ],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
