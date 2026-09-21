import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Acharya [ASTROLOGER NAME] | Founder, Aapka Astro & Viar.in',
  description:
    'Learn about Acharya [ASTROLOGER NAME], with over [X] years of experience in Vedic astrology, Vastu Shastra, and gemstone science, trusted by over 26,000 followers.',
  openGraph: {
    title: 'About Acharya [ASTROLOGER NAME] — Master Astrologer',
    description:
      'Learn about Acharya [ASTROLOGER NAME], founder of Aapka Astro and instructor at Viar.in.',
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
