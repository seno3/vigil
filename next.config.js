/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@google/generative-ai', 'mongoose'],
  },
};

module.exports = nextConfig;
