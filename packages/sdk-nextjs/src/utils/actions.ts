const INTERNAL_ACTION_KEY_PREFIX = '$ACTION_';

/** Next.js / React Server Actions inject internal `$ACTION*` metadata fields. */
function isInternalActionKey(key: string): boolean {
  return key.startsWith(INTERNAL_ACTION_KEY_PREFIX) || key === '$ACTION';
}

function isFormData(value: unknown): value is FormData {
  return (
    (typeof FormData !== 'undefined' && value instanceof FormData) ||
    (typeof value === 'object' &&
      value !== null &&
      typeof (value as FormData).entries === 'function' &&
      Object.prototype.toString.call(value) === '[object FormData]')
  );
}

export function parsePayload(
  payload: FormData | Record<string, unknown>,
): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const entries: Iterable<[string, unknown]> = isFormData(payload)
    ? payload.entries()
    : Object.entries(payload);

  const result: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    if (isInternalActionKey(key)) continue;
    result[key] = value;
  }
  return result;
}

export function extractEntryId(
  payload: Record<string, unknown>,
  explicitId?: string,
): string {
  if (explicitId) return explicitId;
  const id = payload['id'] || payload['entryId'];
  if (!id || typeof id !== 'string') {
    throw new Error(
      'entryId is required but was not provided in arguments or payload.',
    );
  }
  return id;
}
