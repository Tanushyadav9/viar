import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Timezone Conversion & Live Window Logic', () => {
  // Pure helper replicating timezones.ts calculation
  function getJoinWindowStatus(
    scheduledStartTimeIso: string,
    windowMinutesBefore = 15,
    durationMinutes = 90,
    currentTimeMs?: number
  ): {
    canJoin: boolean;
    isLive: boolean;
    isPast: boolean;
    status: 'too_early' | 'window_open' | 'live_now' | 'ended';
  } {
    const startMs = new Date(scheduledStartTimeIso).getTime();
    const windowOpenMs = startMs - windowMinutesBefore * 60 * 1000;
    const endMs = startMs + durationMinutes * 60 * 1000;
    const now = currentTimeMs !== undefined ? currentTimeMs : Date.now();

    if (now < windowOpenMs) {
      return { canJoin: false, isLive: false, isPast: false, status: 'too_early' };
    } else if (now >= windowOpenMs && now < startMs) {
      return { canJoin: true, isLive: false, isPast: false, status: 'window_open' };
    } else if (now >= startMs && now <= endMs) {
      return { canJoin: true, isLive: true, isPast: false, status: 'live_now' };
    } else {
      return { canJoin: false, isLive: false, isPast: true, status: 'ended' };
    }
  }

  function formatInTimezone(
    dateInput: string | Date,
    targetTimezone: string
  ): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(date);
  }

  it('should accurately convert 14:00 UTC to Indian Standard Time (IST)', () => {
    const utcTime = '2026-10-07T14:00:00Z';
    const formattedIst = formatInTimezone(utcTime, 'Asia/Kolkata');
    // 14:00 UTC + 5:30 = 7:30 PM IST
    assert.match(formattedIst, /7:30\s*PM/i, '14:00 UTC must format to 7:30 PM in IST');
  });

  it('should accurately convert 14:00 UTC to Eastern Daylight Time (EDT/EST)', () => {
    const utcTime = '2026-10-07T14:00:00Z';
    const formattedEst = formatInTimezone(utcTime, 'America/New_York');
    // 14:00 UTC is 10:00 AM EDT (UTC-4 in October)
    assert.match(formattedEst, /10:00\s*AM/i, '14:00 UTC must format to 10:00 AM in America/New_York');
  });

  it('should accurately convert 14:00 UTC to British Time (BST/GMT)', () => {
    const utcTime = '2026-10-07T14:00:00Z';
    const formattedUk = formatInTimezone(utcTime, 'Europe/London');
    // 14:00 UTC is 3:00 PM BST (UTC+1 in October)
    assert.match(formattedUk, /3:00\s*PM/i, '14:00 UTC must format to 3:00 PM in Europe/London');
  });

  it('should classify session >15 minutes before start as too_early', () => {
    const classTime = '2026-10-07T14:00:00Z';
    const thirtyMinsBefore = new Date('2026-10-07T13:30:00Z').getTime();
    const result = getJoinWindowStatus(classTime, 15, 90, thirtyMinsBefore);
    assert.strictEqual(result.canJoin, false);
    assert.strictEqual(result.status, 'too_early');
  });

  it('should classify session 10 minutes before start as window_open (canJoin: true)', () => {
    const classTime = '2026-10-07T14:00:00Z';
    const tenMinsBefore = new Date('2026-10-07T13:50:00Z').getTime();
    const result = getJoinWindowStatus(classTime, 15, 90, tenMinsBefore);
    assert.strictEqual(result.canJoin, true);
    assert.strictEqual(result.status, 'window_open');
  });

  it('should classify session 30 minutes in as live_now (canJoin: true, isLive: true)', () => {
    const classTime = '2026-10-07T14:00:00Z';
    const thirtyMinsIn = new Date('2026-10-07T14:30:00Z').getTime();
    const result = getJoinWindowStatus(classTime, 15, 90, thirtyMinsIn);
    assert.strictEqual(result.canJoin, true);
    assert.strictEqual(result.isLive, true);
    assert.strictEqual(result.status, 'live_now');
  });

  it('should classify session 2 hours after start as ended', () => {
    const classTime = '2026-10-07T14:00:00Z';
    const twoHoursAfter = new Date('2026-10-07T16:00:00Z').getTime();
    const result = getJoinWindowStatus(classTime, 15, 90, twoHoursAfter);
    assert.strictEqual(result.canJoin, false);
    assert.strictEqual(result.status, 'ended');
  });
});
