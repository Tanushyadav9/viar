import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageContext';
import WelcomeCohortModal from '@/components/WelcomeCohortModal';

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://viar.in'),
  title: 'VIAR | Vihangam Institute of Astrology and Research',
  description:
    'Vihangam Institute of Astrology and Research (VIAR, viar.in) is the premier Vedic astrology institute founded by Acharya Niraj Kumar (Jyotish Acharya, Bharatiya Vidya Bhavan). Comprehensive 23-module self-paced video masterclasses, practical chart workshops, and verifiable certification.',
  alternates: {
    canonical: 'https://viar.in',
    languages: {
      'en': 'https://viar.in',
      'hi': 'https://viar.in/hi',
      'x-default': 'https://viar.in',
    },
  },
  icons: {
    icon: [
      { url: '/images/favicon.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  keywords: [
    'vihangam institute of astrology and research',
    'viar',
    'viar.in',
    'astrology courses',
    'vedic astrology classes',
    'jyotish acharya',
    'acharya niraj kumar',
    'self paced astrology course',
    'aapka astro',
    'learn astrology online',
  ],
  openGraph: {
    title: 'VIAR — Vihangam Institute of Astrology and Research',
    description:
      'Master authentic Vedic astrology through 23 self-paced video modules and real chart analysis workshops with Acharya Niraj Kumar. Lifetime access and verifiable certification.',
    url: 'https://viar.in',
    siteName: 'VIAR — Vihangam Institute of Astrology and Research',
    images: [
      {
        url: '/images/logo.png',
        width: 1024,
        height: 1024,
        alt: 'VIAR - Vihangam Institute of Astrology and Research',
      },
    ],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('viar_theme');
                  // Default to 'light' mode unless user explicitly selected 'dark'
                  var theme = (saved === 'dark' || saved === 'light') ? saved : 'light';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'Vihangam Institute of Astrology and Research',
              alternateName: ['VIAR', 'Viar.in'],
              url: 'https://viar.in',
              logo: 'https://viar.in/images/logo.png',
              description:
                'Pioneering Vedic astrology institute bridging ancient wisdom with contemporary inquiry, offering comprehensive self-paced video modules and verifiable certification.',
              founder: {
                '@type': 'Person',
                name: 'Acharya Niraj Kumar',
                jobTitle: 'Founder & Master Astrologer',
              },
              sameAs: [
                'https://aapkaastro.com',
                'https://www.youtube.com/@aapkaastro7900',
                'https://www.facebook.com/aapkaastro',
                'https://www.instagram.com/aapkaastrologer/',
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased cosmic-bg flex flex-col min-h-screen selection:bg-amber-500 selection:text-black`}
      >
        {/* // TODO: SWITCH BACK TO LIVE CLERK KEYS ONCE viar.in DNS IS VERIFIED */}
        {/* Keys must be supplied via Vercel / environment variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY). Zero code fallbacks. */}
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
            <ThemeProvider>
              <LanguageProvider>
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
                <WelcomeCohortModal />
              </LanguageProvider>
            </ThemeProvider>
          </ClerkProvider>
        ) : (
          <ThemeProvider>
            <LanguageProvider>
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-mono text-amber-300">
                ⚠️ <strong>Authentication Misconfigured:</strong> <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is missing from environment variables.
              </div>
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
              <WelcomeCohortModal />
            </LanguageProvider>
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}