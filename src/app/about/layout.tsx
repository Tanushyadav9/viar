import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Acharya Niraj Kumar | Founder, Aapka Astro & Viar.in',
  description:
    'Learn about Acharya Niraj Kumar, Jyotish Acharya (Bhartiya Vidya Bhawan), AstroVastu expert, and former VP & Business Head with over 20 years of Vedic practice, trusted by 26,000+ followers.',
  openGraph: {
    title: 'About Acharya Niraj Kumar — Master Astrologer & AstroVastu Expert',
    description:
      'Learn about Acharya Niraj Kumar, founder of Aapka Astro and lead instructor at Viar.in.',
    url: 'https://viar.in/about',
    siteName: 'Viar.in',
    type: 'profile',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
