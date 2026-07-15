import { BadRequestError } from '../common/errors/http-error.js';

export function parsePositiveIntParam(
  value: unknown,
  fallback: number,
  name: string,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestError(`'${name}' must be a positive integer.`);
  }
  return parsed;
}
