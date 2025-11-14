import { formatDurationHMS, diffSecondsBetweenIso } from '../utils/duration';

describe('formatDurationHMS', () => {
  test('under 1 minute', () => {
    expect(formatDurationHMS(5)).toBe('5 secs');
    expect(formatDurationHMS(0)).toBe('0 secs');
  });

  test('exactly 1 hour', () => {
    expect(formatDurationHMS(3600)).toBe('1 hour');
  });

  test('multi-hour intervals with minutes and seconds', () => {
    // 1h 12m 2s = 4322
    expect(formatDurationHMS(4322)).toBe('1 hour 12 mins 2 secs');
  });

  test('pluralization correctness', () => {
    expect(formatDurationHMS(61)).toBe('1 min 1 sec');
    expect(formatDurationHMS(120)).toBe('2 mins');
  });
});

describe('diffSecondsBetweenIso', () => {
  test('computes zero for invalid inputs', () => {
    expect(diffSecondsBetweenIso('bad', 'also bad')).toBe(0);
  });

  test('computes correct seconds between two iso times', () => {
    const start = '2025-01-01T12:37:02.000Z';
    const end = '2025-01-01T13:49:04.000Z';
    expect(diffSecondsBetweenIso(start, end)).toBe(4322);
  });

  test('non-negative result even if end before start', () => {
    const start = '2025-01-01T13:00:00.000Z';
    const end = '2025-01-01T12:59:59.000Z';
    expect(diffSecondsBetweenIso(start, end)).toBe(0);
  });
});
