import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viar.in';

  // Static routes
  const routes = [
    '',
    '/courses',
    '/about',
    '/contact',
    '/verify',
    '/refund-policy',
    '/terms',
    '/privacy-policy',
    '/disclaimer',
    '/pricing-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic course routes fetched directly from PostgreSQL
  try {
    const publishedCourses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    });

    const courseRoutes = publishedCourses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt || new Date(),
      changeFrequency: 'daily' as const,
      priority: course.slug === 'what-is-astrology' ? 0.95 : 0.8,
    }));

    return [...routes, ...courseRoutes];
  } catch (err) {
    console.error('Failed to load published courses for sitemap:', err);
    return routes;
  }
}
