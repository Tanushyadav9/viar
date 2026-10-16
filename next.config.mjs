/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OWNER_EMAIL: process.env.OWNER_EMAIL || '',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/privacy',
        destination: '/privacy-policy',
        permanent: true,
      },
      {
        source: '/refund',
        destination: '/refund-policy',
        permanent: true,
      },
      {
        source: '/pricing',
        destination: '/pricing-policy',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
