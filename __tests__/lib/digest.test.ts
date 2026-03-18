import {
  getDigestKey,
  getNextDigestSchedule,
} from '@/lib/notifications/digest';

describe('notification digest helpers', () => {
  it('creates stable digest keys from the scheduled send time', () => {
    const scheduledFor = new Date('2026-03-16T09:00:00.000Z');

    expect(getDigestKey('daily', scheduledFor, 'UTC')).toBe('daily:2026-03-16');
    expect(getDigestKey('hourly', scheduledFor, 'UTC')).toBe(
      'hourly:2026-03-16:09',
    );
  });

  it('returns a future hourly schedule', () => {
    const fromDate = new Date('2026-03-14T10:17:00.000Z');
    const scheduled = new Date(getNextDigestSchedule('hourly', 'UTC', fromDate));

    expect(Number.isNaN(scheduled.getTime())).toBe(false);
    expect(scheduled.getTime()).toBeGreaterThan(fromDate.getTime());
  });
});
