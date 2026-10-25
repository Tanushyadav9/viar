/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
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
      // Permanent Redirects for Removed Courses to Course Catalog
      {
        source: '/courses/vedic-muhurta-mastery-1791997075023',
        destination: '/courses',
        permanent: true,
      },
      {
        source: '/courses/vedic-muhurta',
        destination: '/courses',
        permanent: true,
      },
      {
        source: '/courses/vastu-shastra-for-your-home',
        destination: '/courses',
        permanent: true,
      },
      {
        source: '/courses/gemstone-science-101',
        destination: '/courses',
        permanent: true,
      },
      {
        source: '/courses/numerology-basics',
        destination: '/courses',
        permanent: true,
      },
      // Friendly URL Permanent Redirects for Cohort Identifiers
      {
        source: '/dashboard/courses/cohort-wia-batch-1',
        destination: '/dashboard/courses/what-is-astrology',
        permanent: true,
      },
      {
        source: '/dashboard/courses/cohort-wia-batch-1/:path*',
        destination: '/dashboard/courses/what-is-astrology/:path*',
        permanent: true,
      },
      {
        source: '/checkout/cohort-wia-batch-1',
        destination: '/checkout/what-is-astrology',
        permanent: true,
      },
      {
        source: '/checkout/cohort-wia-batch-1/:path*',
        destination: '/checkout/what-is-astrology/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/courses/the-ultimate-astrology-course',
        destination: '/dashboard/courses/what-is-astrology',
        permanent: true,
      },
      {
        source: '/checkout/the-ultimate-astrology-course',
        destination: '/checkout/what-is-astrology',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
