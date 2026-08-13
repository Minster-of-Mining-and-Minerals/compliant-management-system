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
  async rewrites() {
    return [
      {
        source: '/api/auth/:action(session|csrf|providers|callback|signout|signin|_log)', 
        destination: '/api/auth/:action',
      },
      {
        source: '/api/auth/callback/:provider', 
        destination: '/api/auth/callback/:provider',
      },
      {
        source: '/api/:path*',
        // Proxy all other /api routes to the backend
        destination: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000/api'}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
