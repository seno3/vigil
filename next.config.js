/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@google/generative-ai'],
  },
};

module.exports = nextConfig;
