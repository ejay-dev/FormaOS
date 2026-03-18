import {
  getDefaultDigestFrequency,
  getNotificationCategory,
} from '@/lib/notifications/types';

describe('notification types', () => {
  it('maps event types to the expected categories', () => {
    expect(getNotificationCategory('task.assigned')).toBe('tasks');
    expect(getNotificationCategory('member.role_changed')).toBe('team');
    expect(getNotificationCategory('system.security_alert')).toBe('system');
  });

  it('selects sensible default digest frequencies', () => {
    expect(getDefaultDigestFrequency('email', 'critical')).toBe('instant');
    expect(getDefaultDigestFrequency('email', 'high')).toBe('hourly');
    expect(getDefaultDigestFrequency('email', 'normal')).toBe('daily');
    expect(getDefaultDigestFrequency('slack', 'normal')).toBe('instant');
  });
});
