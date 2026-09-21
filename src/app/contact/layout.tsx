import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Viar.in Academy | Student Support & Inquiries',
  description:
    'Have questions about astrology cohorts, international payments, or curriculum? Contact the Viar.in academy team.',
  openGraph: {
    title: 'Contact Viar.in Academy',
    description: 'Get in touch for course admissions, batch schedules, and student assistance.',
    url: 'https://viar.in/contact',
    siteName: 'Viar.in',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
