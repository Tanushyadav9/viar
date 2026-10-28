/**
 * Feature Flags Configuration
 * Vihangam Institute of Astrology and Research (VIAR)
 * 
 * ONE_TO_ONE_ENABLED:
 * Feature flag controlling the undecided 1-on-1 mentorship / personal sessions feature.
 * Defaults to FALSE (off) unless explicitly set to 'true' in environment variables.
 * 
 * When false (default):
 * - Admin tabs, tiles, headers, and policies display only "Course Live Classes & Timetable" (cohort model).
 * - Admin Home counters and telemetry show "Live Classes (Upcoming)".
 * - Course cards, hero pillars, and footers mention only recorded modules and interactive cohort live classes with recordings.
 * - Announcement texts omit all references to 1-on-1 mentorship.
 * - Student portal displays live classes and recordings, with zero 1-on-1 booking or birth details intake.
 * - Transactional emails reference "Live Class" instead of "1-on-1 Class".
 * - Chatbot knowledge directs visitors to Aapka Astro for personal consultations and describes VIAR as cohort-based training.
 * 
 * All underlying schemas, tables, and service logic are preserved so that if the client
 * decides to activate 1-on-1 sessions in the future, it can be re-enabled via ONE_TO_ONE_ENABLED=true.
 */

export const ONE_TO_ONE_ENABLED: boolean =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_ONE_TO_ONE_ENABLED === 'true' ||
     process.env.ONE_TO_ONE_ENABLED === 'true')) ||
  false;
