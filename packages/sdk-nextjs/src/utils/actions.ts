export function parsePayload(
  payload: FormData | Record<string, unknown>,
): Record<string, unknown> {
  if (payload instanceof FormData) {
    const entries = Array.from(payload.entries());
    const result: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      if (key.startsWith('$ACTION_ID_')) continue; // Ignore Next.js internal action keys
      result[key] = value;
    }
    return result;
  }
  return payload;
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
