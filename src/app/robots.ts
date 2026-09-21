import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viar.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/instructor/',
          '/admin/',
          '/checkout/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
