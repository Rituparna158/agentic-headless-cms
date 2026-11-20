import { describe, it, expect } from 'vitest';
import {
  getSubmissionTimestamp,
  formatSubmissionDate,
} from '../../../../src/features/inbox/utils/inbox.util';

describe('inbox util', () => {
  it('prefers receivedAt, then createdAt, then empty', () => {
    expect(
      getSubmissionTimestamp({
        data: { receivedAt: 'R' },
        createdAt: 'C',
      } as never),
    ).toBe('R');
    expect(getSubmissionTimestamp({ data: {}, createdAt: 'C' } as never)).toBe(
      'C',
    );
    expect(getSubmissionTimestamp({} as never)).toBe('');
  });

  it('formats valid dates and rejects invalid ones', () => {
    expect(formatSubmissionDate('2026-01-02T03:04:05Z')).not.toBe('');
    expect(formatSubmissionDate('not a date')).toBe('');
    expect(formatSubmissionDate('')).toBe('');
  });
});
