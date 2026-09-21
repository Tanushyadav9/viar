/**
 * Sister Ecosystem Services Configuration
 * Centralized configuration for cross-promotion across Viar.in, Aapka Astro, and DOW Consulting.
 * Update URLs and descriptions here to reflect across the entire platform.
 */

export interface SisterService {
  name: string;
  domain: string;
  url: string;
  tagline: string;
  description: string;
  ctaText: string;
  badge: string;
}

export const SISTER_SERVICES: Record<'aapkaAstro' | 'dowConsulting', SisterService> = {
  aapkaAstro: {
    name: 'Aapka Astro',
    domain: 'aapkaastro.com',
    url: 'https://aapkaastro.com',
    tagline: '1-on-1 Personal Astrology & Vastu Consultations',
    description:
      'Private birth chart readings, Kundli matching, Prashna Jyotish, and residential Vastu audits directly with Acharya [ASTROLOGER NAME].',
    ctaText: 'Book Personal Consultation',
    badge: 'Sister Platform',
  },
  dowConsulting: {
    name: 'DOW Consulting',
    domain: 'dowconsulting.in',
    url: 'https://dowconsulting.in',
    tagline: 'Corporate & Enterprise Astrology Advisory',
    description:
      'Strategic Vedic timing (Muhurta), executive leadership alignment, corporate launch planning, and commercial real estate Vastu advisory.',
    ctaText: 'Explore Corporate Advisory',
    badge: 'Enterprise Advisory',
  },
};
