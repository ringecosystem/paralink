import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['gcs.subscan.io', 'media-resources.subwallet.app', 'dev.sw-chain-list-assets.pages.dev']
  },
  reactStrictMode: false
};

export default nextConfig;
