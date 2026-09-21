import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Catalog | Vedic Astrology Academy | Viar.in',
  description:
    'Explore authentic Vedic astrology courses by Acharya [ASTROLOGER NAME]. Interactive live Zoom cohorts, structured 3-week blocks, final examination, and recognized certification.',
  keywords: [
    'vedic astrology courses',
    'jyotish curriculum',
    'what is astrology course',
    'astrology certification courses',
    'aapka astro classes',
  ],
  openGraph: {
    title: 'Vedic Astrology Course Catalog — Viar.in',
    description:
      'Explore live cohort-based courses in Vedic Astrology. Enroll in our flagship 9-week masterclass.',
    url: 'https://viar.in/courses',
    siteName: 'Viar.in',
    type: 'website',
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
