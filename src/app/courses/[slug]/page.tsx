import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INITIAL_COURSES } from '@/lib/data';
import CourseDetailClient from '@/components/CourseDetailClient';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = INITIAL_COURSES.find((c) => c.slug === params.slug) || INITIAL_COURSES[0];
  if (!course) {
    return {
      title: 'Course Not Found | Viar.in',
    };
  }

  const title = `${course.title} | Live Vedic Astrology Course | Viar.in`;
  const description = `${course.tagline} Live interactive cohort on Zoom/Meet with Acharya [ASTROLOGER NAME]. ${course.totalClasses} classes, lifetime recordings, final exam, and verifiable certificate.`;

  return {
    title,
    description,
    keywords: [
      course.title,
      'vedic astrology course',
      'learn astrology online',
      'jyotish masterclass',
      'aapka astro',
      'acharya',
      'astrology certification',
    ],
    openGraph: {
      title,
      description,
      url: `https://viar.in/courses/${course.slug}`,
      siteName: 'Viar.in',
      type: 'website',
      images: [
        {
          url: course.instructor.avatarUrl,
          width: 800,
          height: 600,
          alt: course.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [course.instructor.avatarUrl],
    },
    alternates: {
      canonical: `https://viar.in/courses/${course.slug}`,
    },
  };
}

export default function CourseDetailPage({ params }: Props) {
  const course = INITIAL_COURSES.find((c) => c.slug === params.slug) || INITIAL_COURSES[0];

  if (!course) {
    notFound();
  }

  // Schema.org Course Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'Viar.in',
      url: 'https://viar.in',
      sameAs: 'https://aapkaastro.com',
    },
    instructor: {
      '@type': 'Person',
      name: course.instructor.name,
      jobTitle: course.instructor.title,
      url: 'https://aapkaastro.com',
    },
    educationalCredentialAwarded: 'Certificate of Completion in Vedic Astrology',
    occupationalCredentialAwarded: 'Jyotish Foundations Accredited Certificate',
    totalHistoricalEnrollment: 4800,
    coursePrerequisites: 'None. Open to passionate beginners worldwide.',
    offers: [
      {
        '@type': 'Offer',
        price: course.priceInr,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        category: 'Tuition',
        url: `https://viar.in/courses/${course.slug}`,
      },
      {
        '@type': 'Offer',
        price: course.priceUsd,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        category: 'Tuition',
        url: `https://viar.in/courses/${course.slug}`,
      },
    ],
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      duration: `P${course.durationWeeks}W`,
      courseWorkload: `PT${course.totalClasses * 1.5}H`,
      instructor: {
        '@type': 'Person',
        name: course.instructor.name,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CourseDetailClient slug={params.slug} />
    </>
  );
}
