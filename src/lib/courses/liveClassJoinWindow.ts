/**
 * Live Class Join Window & Button State Computation
 * Vihangam Institute of Astrology and Research (VIAR)
 *
 * Client-safe pure utility (zero Prisma, zero Node built-in imports).
 *
 * Rules:
 * 1. Date, time, title, and agenda appear as soon as a class is published.
 * 2. Meeting join link appears N minutes before start (default 30 min) until 2 hours after end.
 *    Outside that window, the link is strictly gated (null).
 * 3. 4 Explicit Button States:
 *    - "Starts in…" (countdown when outside reveal window)
 *    - "Join now" (clickable when window is open and class is live or starting)
 *    - "Class ended: recording coming soon" (after class has ended and recording not yet uploaded)
 *    - "Watch recording" (when recording URL is available)
 */

export type LiveClassButtonState =
  | 'STARTS_IN'
  | 'JOIN_NOW'
  | 'CLASS_ENDED'
  | 'WATCH_RECORDING';

export interface JoinWindowComputation {
  isWindowOpen: boolean;
  canJoin: boolean;
  hasEnded: boolean;
  buttonState: LiveClassButtonState;
  buttonLabelEn: string;
  buttonLabelHi: string;
  startsInFormattedEn?: string;
  startsInFormattedHi?: string;
  revealMinutesBefore: number;
  revealStartMs: number;
  revealEndMs: number;
  startMs: number;
  endMs: number;
}

export const DEFAULT_REVEAL_MINUTES = 30;
export const POST_CLASS_WINDOW_HOURS = 2;

/**
 * Formats duration between now and start time into clean English and Hindi countdown string.
 */
export function formatStartsInCountdown(diffMs: number): {
  en: string;
  hi: string;
} {
  if (diffMs <= 0) {
    return {
      en: 'Starts in moments…',
      hi: 'कुछ ही पलों में प्रारंभ…',
    };
  }

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    const dStrEn = `${days}d ${hours}h`;
    const dStrHi = `${days} दिन ${hours} घंटे`;
    return {
      en: `Starts in ${dStrEn}`,
      hi: `प्रारंभ होने में ${dStrHi}`,
    };
  }

  if (hours > 0) {
    const hStrEn = `${hours}h ${minutes}m`;
    const hStrHi = `${hours} घंटे ${minutes} मिनट`;
    return {
      en: `Starts in ${hStrEn}`,
      hi: `प्रारंभ होने में ${hStrHi}`,
    };
  }

  return {
    en: `Starts in ${minutes}m`,
    hi: `प्रारंभ होने में ${minutes} मिनट`,
  };
}

/**
 * Computes join window status, end time, and explicit button state.
 */
export function computeLiveClassJoinWindow(params: {
  startTime: string | Date;
  durationMinutes?: number | null;
  recordingUrl?: string | null;
  revealMinutesBefore?: number | null;
  nowMs?: number;
}): JoinWindowComputation {
  const now = params.nowMs ?? Date.now();
  const startDate = typeof params.startTime === 'string' ? new Date(params.startTime) : params.startTime;
  const startMs = startDate.getTime();
  const duration = params.durationMinutes && params.durationMinutes > 0 ? params.durationMinutes : 60;
  const endMs = startMs + duration * 60 * 1000;

  const revealMinutes =
    params.revealMinutesBefore && params.revealMinutesBefore > 0
      ? params.revealMinutesBefore
      : DEFAULT_REVEAL_MINUTES;

  const revealStartMs = startMs - revealMinutes * 60 * 1000;
  const revealEndMs = endMs + POST_CLASS_WINDOW_HOURS * 60 * 60 * 1000;

  const isWindowOpen = now >= revealStartMs && now <= revealEndMs;
  const hasEnded = now > endMs;
  const canJoin = isWindowOpen && !hasEnded;
  const hasRecording = Boolean(params.recordingUrl && params.recordingUrl.trim().length > 0);

  let buttonState: LiveClassButtonState;
  let buttonLabelEn: string;
  let buttonLabelHi: string;
  let startsInFormattedEn: string | undefined;
  let startsInFormattedHi: string | undefined;

  if (hasRecording) {
    buttonState = 'WATCH_RECORDING';
    buttonLabelEn = 'Watch recording';
    buttonLabelHi = 'रिकॉर्डिंग देखें';
  } else if (hasEnded) {
    buttonState = 'CLASS_ENDED';
    buttonLabelEn = 'Class ended: recording coming soon';
    buttonLabelHi = 'कक्षा समाप्त: रिकॉर्डिंग जल्द उपलब्ध होगी';
  } else if (canJoin) {
    buttonState = 'JOIN_NOW';
    buttonLabelEn = 'Join now';
    buttonLabelHi = 'अभी जुड़ें';
  } else {
    buttonState = 'STARTS_IN';
    const countdown = formatStartsInCountdown(startMs - now);
    buttonLabelEn = countdown.en;
    buttonLabelHi = countdown.hi;
    startsInFormattedEn = countdown.en;
    startsInFormattedHi = countdown.hi;
  }

  return {
    isWindowOpen,
    canJoin,
    hasEnded,
    buttonState,
    buttonLabelEn,
    buttonLabelHi,
    startsInFormattedEn,
    startsInFormattedHi,
    revealMinutesBefore: revealMinutes,
    revealStartMs,
    revealEndMs,
    startMs,
    endMs,
  };
}

/**
 * Gating function: strictly returns null if now is outside [start - revealMinutes, end + 2h].
 */
export function gateMeetingLinkForStudent(params: {
  rawMeetingLink?: string | null;
  startTime: string | Date;
  durationMinutes?: number | null;
  revealMinutesBefore?: number | null;
  nowMs?: number;
}): string | null {
  if (!params.rawMeetingLink || !params.rawMeetingLink.trim()) {
    return null;
  }

  const window = computeLiveClassJoinWindow({
    startTime: params.startTime,
    durationMinutes: params.durationMinutes,
    revealMinutesBefore: params.revealMinutesBefore,
    nowMs: params.nowMs,
  });

  return window.isWindowOpen ? params.rawMeetingLink.trim() : null;
}
