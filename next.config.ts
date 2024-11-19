import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['gcs.subscan.io', 'media-resources.subwallet.app']
  },
  reactStrictMode: false
};

export default nextConfig;
