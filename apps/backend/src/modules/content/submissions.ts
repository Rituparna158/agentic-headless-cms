import crypto from 'crypto';
import type { SubmissionResult } from './types/submissions.types.js';
import { LIMITS, EMAIL } from './constants/submissions.constants.js';

export type { SubmissionResult };
export { LIMITS };

// Control characters (except tab / new line) are never wanted in text
const clean = (v: unknown, max: number): string =>
  (typeof v === 'string' || typeof v === 'number' ? String(v) : '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);

export function validateSubmission(body: unknown): SubmissionResult {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return { ok: false, error: 'Invalid request.' };
  const b = body as Record<string, unknown>;
  const type = b.type;
  if (type !== 'form' && type !== 'comment')
    return { ok: false, error: 'Unknown submission type.' };

  const rawFields =
    b.fields && typeof b.fields === 'object' && !Array.isArray(b.fields)
      ? (b.fields as Record<string, unknown>)
      : null;
  if (!rawFields) return { ok: false, error: 'Nothing was sent.' };

  // A hidden field real visitors never fill in: bots do. Pretend it worked.
  if (
    clean(b.hp, 100) ||
    clean(rawFields.website, 100) ||
    clean(rawFields._hp, 100)
  )
    return { ok: true, spam: true };

  const entries = Object.entries(rawFields).filter(
    ([k]) => k !== 'website' && k !== '_hp',
  );
  if (entries.length === 0 || entries.length > LIMITS.fields)
    return { ok: false, error: 'Check the form and try again.' };

  const fields: Record<string, string> = {};
  for (const [k, v] of entries) {
    if (!/^[a-z][a-z0-9_]{0,39}$/i.test(k))
      return { ok: false, error: 'Check the form and try again.' };
    if (typeof v === 'object' && v !== null)
      return { ok: false, error: 'Check the form and try again.' };
    fields[k] = clean(v, LIMITS.value);
  }
  if (!Object.values(fields).some(Boolean))
    return { ok: false, error: 'Please fill in the form.' };

  const email = fields.email;
  if (email && (!EMAIL.test(email) || email.length > LIMITS.email))
    return { ok: false, error: 'Please enter a valid email address.' };

  const receivedAt = new Date().toISOString();
  const slug = crypto.randomBytes(6).toString('hex');

  if (type === 'comment') {
    const message = clean(fields.message ?? fields.comment, LIMITS.message);
    const name = clean(fields.name, LIMITS.name);
    const postSlug = clean(b.postSlug, LIMITS.slug);
    if (!message || !name)
      return { ok: false, error: 'Please add your name and a comment.' };
    if (!postSlug) return { ok: false, error: 'Missing post.' };
    return {
      ok: true,
      spam: false,
      data: {
        kind: 'submission',
        submissionType: 'comment',
        title: `Comment from ${name}`,
        slug,
        name,
        email: email || '',
        message,
        postSlug,
        receivedAt,
      },
    };
  }

  const form = clean(b.form, LIMITS.form) || 'contact';
  if (!/^[a-z0-9_-]+$/i.test(form))
    return { ok: false, error: 'Check the form and try again.' };
  return {
    ok: true,
    spam: false,
    data: {
      kind: 'submission',
      submissionType: 'form',
      title: `${form}: ${fields.name || fields.email || 'visitor'}`,
      slug,
      form,
      fields,
      receivedAt,
    },
  };
}
