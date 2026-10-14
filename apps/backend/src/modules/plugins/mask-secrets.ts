const SENSITIVE_KEY_REGEX =
  /key|secret|token|password|credential|private|auth/i;

export function maskSensitiveValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length === 0) return value;
    if (value.length <= 8) return '********';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(maskSensitiveValue);
    }
    return maskConfigSecrets(value as Record<string, unknown>);
  }
  return '********';
}

export function maskConfigSecrets(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(config)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      masked[key] = maskSensitiveValue(val);
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      masked[key] = maskConfigSecrets(val as Record<string, unknown>);
    } else {
      masked[key] = val;
    }
  }
  return masked;
}
