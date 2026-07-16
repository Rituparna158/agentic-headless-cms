import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RELATIVE_TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

/** Formats an ISO timestamp as "2m ago", "3h ago", etc. — falls back to "just now" under a minute. */
export function formatRelativeTime(isoDate: string): string {
  const seconds = (Date.now() - new Date(isoDate).getTime()) / 1000;

  for (const [unit, secondsInUnit] of RELATIVE_TIME_UNITS) {
    if (seconds >= secondsInUnit) {
      return relativeTimeFormatter.format(
        -Math.floor(seconds / secondsInUnit),
        unit,
      );
    }
  }
  return 'just now';
}
