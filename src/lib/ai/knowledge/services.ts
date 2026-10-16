/**
 * Structured Knowledge Base: Academic Curriculum & Services
 * Extracted directly from official course curriculum and syllabi on viar.in.
 */

export interface CurriculumSection {
  id: string;
  title: string;
  modulesCount: number;
  totalDurationHours: number;
  format: string;
  summary: string;
  topics: string[];
}

export const ACADEMIC_SERVICES_KNOWLEDGE: CurriculumSection = {
  id: 'vedic-astrology-masterclass',
  title: 'Vedic Astrology Masterclass: What is Astrology (Flagship)',
  modulesCount: 25, // 23 core modules + 2 bonus workshops
  totalDurationHours: 46,
  format: '100% Self-Paced On-Demand Video Masterclass with Lifetime Access',
  summary:
    'A comprehensive, scientific and structured foundation in Parashari Vedic Astrology designed by Acharya Niraj Kumar. ' +
    'Covers everything from absolute fundamentals to advanced predictive techniques across 50 video lessons.',
  topics: [
    'Module 1–3: Fundamentals — What is Astrology, astronomy of the zodiac, 12 Rashis (Zodiac signs), elements, and gunas',
    'Module 4–6: The 9 Planets (Navagrahas) — Natural characteristics, benefic/malefic status, planetary friendships, aspects (Drishti)',
    'Module 7–9: The 12 Houses (Bhavas) — Significations of Kendras, Trikonas, Dusthanas, Upachayas, and house lords',
    'Module 10–12: 27 Nakshatras & Lunar Mansions — Padas, deities, ruling planets, and psychological archetypes',
    'Module 13–15: Planetary Yogas & Combinations — Raja Yogas, Dhana Yogas, Viparita Raja Yogas, and classical combinations',
    'Module 16–17: Dasha System & Timing of Events — Vimshottari Dasha, Antardasha, and Mahadasha calculation & prediction',
    'Module 18–19: Transits (Gochar) & Sade Sati — Transit of Saturn, Jupiter, Rahu-Ketu, and planetary returns',
    'Module 20–21: Divisional Charts (Vargas) — Reading D-9 Navamsha for marriage/dharma and D-10 Dashamsha for career',
    'Module 22–23: Astro-Vastu & Remedies — Logical remedial science, gemstone guidelines, mantra, and practical Vastu rectification',
    'Bonus Masterclass 1: Medical Astrology & Longevity Analysis',
    'Bonus Masterclass 2: Practical Chart Reading Masterclass with real horoscopes',
  ],
};
