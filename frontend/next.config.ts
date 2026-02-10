// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // Remove deprecated options
  // experimental: {
  //   appDir: true,
  // },
  
  // Remove eslint config
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  
  // Remove serverRuntimeConfig
  // serverRuntimeConfig: {},
  
  // Add these instead
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // For Docker deployment
  output: 'standalone', // This is important for Docker
  
  // Configure images if needed
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
