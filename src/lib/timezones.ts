// Timezone list and formatting utilities

export interface TimezoneOption {
  label: string;
  tz: string;
  offset: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { label: 'India Standard Time (IST)', tz: 'Asia/Kolkata', offset: 'UTC+05:30' },
  { label: 'US Eastern Time (EDT/EST)', tz: 'America/New_York', offset: 'UTC-04:00' },
  { label: 'US Central Time (CDT/CST)', tz: 'America/Chicago', offset: 'UTC-05:00' },
  { label: 'US Mountain Time (MDT/MST)', tz: 'America/Denver', offset: 'UTC-06:00' },
  { label: 'US Pacific Time (PDT/PST)', tz: 'America/Los_Angeles', offset: 'UTC-07:00' },
  { label: 'British Summer Time / GMT', tz: 'Europe/London', offset: 'UTC+01:00' },
  { label: 'Central European Time (CEST)', tz: 'Europe/Paris', offset: 'UTC+02:00' },
  { label: 'Gulf Standard Time (GST - Dubai)', tz: 'Asia/Dubai', offset: 'UTC+04:00' },
  { label: 'Singapore / Malaysia (SGT)', tz: 'Asia/Singapore', offset: 'UTC+08:00' },
  { label: 'Australian Eastern Time (AEST/AEDT)', tz: 'Australia/Sydney', offset: 'UTC+10:00' },
  { label: 'New Zealand Time (NZST/NZDT)', tz: 'Pacific/Auckland', offset: 'UTC+12:00' },
  { label: 'Coordinated Universal Time (UTC)', tz: 'UTC', offset: 'UTC+00:00' },
];

export function getUserLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

export function formatInTimezone(
  isoDateString: string,
  targetTimezone: string,
  formatType: 'full' | 'short' | 'timeOnly' | 'dateOnly' = 'full'
): string {
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;

    const tz = targetTimezone || 'Asia/Kolkata';

    if (formatType === 'timeOnly') {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short',
      }).format(date);
    }

    if (formatType === 'dateOnly') {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }

    if (formatType === 'short') {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short',
      }).format(date);
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(date);
  } catch (err) {
    console.error('Timezone format error:', err);
    return new Date(isoDateString).toLocaleString();
  }
}

/**
 * Calculates whether a student can access the live Zoom/Meet link.
 * Link becomes visible only within 15 minutes of start (or when class is LIVE).
 * Otherwise, precise countdown is returned.
 */
export function getJoinWindowStatus(
  isoStartTime: string,
  windowMinutes: number = 15,
  durationMinutes: number = 90
): {
  isWithinWindow: boolean;
  isLive: boolean;
  isPast: boolean;
  canJoin: boolean;
  minutesUntilStart: number;
  secondsUntilStart: number;
  formattedCountdown: string;
} {
  const startMs = new Date(isoStartTime).getTime();
  const endMs = startMs + durationMinutes * 60 * 1000;
  const nowMs = Date.now();

  const windowStartMs = startMs - windowMinutes * 60 * 1000;
  const isPast = nowMs > endMs;
  const isLive = nowMs >= startMs && nowMs <= endMs;
  const isWithinWindow = nowMs >= windowStartMs && nowMs <= endMs;
  const canJoin = isWithinWindow || isLive;

  const msUntilStart = Math.max(0, startMs - nowMs);
  const secondsUntilStart = Math.floor(msUntilStart / 1000);
  const minutesUntilStart = Math.floor(secondsUntilStart / 60);

  const days = Math.floor(secondsUntilStart / (3600 * 24));
  const hours = Math.floor((secondsUntilStart % (3600 * 24)) / 3600);
  const mins = Math.floor((secondsUntilStart % 3600) / 60);
  const secs = secondsUntilStart % 60;

  let formattedCountdown = '';
  if (days > 0) {
    formattedCountdown = `${days}d ${hours}h ${mins}m`;
  } else if (hours > 0) {
    formattedCountdown = `${hours}h ${mins}m ${secs}s`;
  } else {
    formattedCountdown = `${mins}m ${secs}s`;
  }

  return {
    isWithinWindow,
    isLive,
    isPast,
    canJoin,
    minutesUntilStart,
    secondsUntilStart,
    formattedCountdown,
  };
}

export function getRelativeClassTime(isoDateString: string): {
  isPast: boolean;
  isLive: boolean;
  timeRemainingText: string;
} {
  const target = new Date(isoDateString).getTime();
  const now = Date.now();
  const diffMinutes = Math.round((target - now) / (1000 * 60));

  if (diffMinutes < -120) {
    return { isPast: true, isLive: false, timeRemainingText: 'Concluded' };
  } else if (diffMinutes <= 15 && diffMinutes >= -120) {
    return { isPast: false, isLive: true, timeRemainingText: 'Live / Starting now' };
  } else if (diffMinutes < 60) {
    return { isPast: false, isLive: false, timeRemainingText: `In ${diffMinutes} minutes` };
  } else if (diffMinutes < 24 * 60) {
    const hours = Math.floor(diffMinutes / 60);
    return { isPast: false, isLive: false, timeRemainingText: `In ${hours} hour${hours > 1 ? 's' : ''}` };
  } else {
    const days = Math.floor(diffMinutes / (60 * 24));
    return { isPast: false, isLive: false, timeRemainingText: `In ${days} day${days > 1 ? 's' : ''}` };
  }
}

export function generateGoogleCalendarUrl(
  title: string,
  description: string,
  location: string,
  isoStartTime: string,
  durationMinutes: number
): string {
  try {
    const start = new Date(isoStartTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${formatGCal(start)}/${formatGCal(end)}`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details: `${description}\n\nJoin URL: ${location}\n\nPlatform: Viar.in (Aapka Astro Academy)`,
      location: location,
      dates: dates,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch {
    return '#';
  }
}
