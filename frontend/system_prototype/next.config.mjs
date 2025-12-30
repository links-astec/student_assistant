/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: ['campusflow.coventry.ac.uk'],
    formats: ['image/webp', 'image/avif'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Required for Cloudflare Workers compatibility
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Build optimization
  swcMinify: true,

  // Environment variables
  env: {
    SITE_URL: process.env.SITE_URL || 'https://campusflow.coventry.ac.uk',
  },
};

export default nextConfig;
