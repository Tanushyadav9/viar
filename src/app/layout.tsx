import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Viar.in | Online Vedic Astrology Education Academy',
  /* PLACEHOLDER: replace with real instructor name */
  description:
    'Viar.in is a premier online astrology academy by Acharya [ASTROLOGER NAME] (Aapka Astro). Live cohort classes on Zoom/Meet, recordings, final test, and verifiable certification.',
  keywords: [
    'astrology courses',
    'vedic astrology classes',
    'jyotish academy',
    'what is astrology course',
    'aapka astro',
    'learn astrology online',
  ],
  openGraph: {
    title: 'Viar.in — Live Vedic Astrology Academy',
    description:
      'Learn authentic Vedic astrology in live interactive cohorts with Acharya [ASTROLOGER NAME]. 18 classes, recordings, and certification.',
    url: 'https://viar.in',
    siteName: 'Viar.in',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#07090e] text-slate-100 flex flex-col min-h-screen selection:bg-amber-500 selection:text-black`}
      >
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
