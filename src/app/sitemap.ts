import { MetadataRoute } from 'next';
import { INITIAL_COURSES } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viar.in';

  // Static routes
  const routes = [
    '',
    '/courses',
    '/about',
    '/contact',
    '/verify',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic course routes
  const courseRoutes = INITIAL_COURSES.map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: course.slug === 'what-is-astrology' ? 0.95 : 0.7,
  }));

  return [...routes, ...courseRoutes];
}
