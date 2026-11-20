import { describe, it, expect } from 'vitest';
import { validateSubmission } from '../../../../src/modules/content/submissions.js';

const ok = (r: ReturnType<typeof validateSubmission>) => {
  if (!r.ok || r.spam) throw new Error('expected a valid submission');
  return r.data;
};

describe('validateSubmission', () => {
  it('accepts a contact form', () => {
    const d = ok(
      validateSubmission({
        type: 'form',
        form: 'contact',
        fields: { name: 'Ann', email: 'ann@x.com', message: 'Hi' },
      }),
    );
    expect(d).toMatchObject({
      kind: 'submission',
      submissionType: 'form',
      form: 'contact',
    });
  });
  it('accepts a comment with name, message and post', () => {
    const d = ok(
      validateSubmission({
        type: 'comment',
        postSlug: 'hello',
        fields: { name: 'Ann', message: 'Nice post' },
      }),
    );
    expect(d).toMatchObject({
      submissionType: 'comment',
      postSlug: 'hello',
      name: 'Ann',
    });
  });
  it('quietly drops bots that fill the hidden field', () => {
    const r = validateSubmission({
      type: 'form',
      fields: { name: 'x', website: 'http://spam' },
    });
    expect(r).toEqual({ ok: true, spam: true });
  });
  it('rejects bad input', () => {
    expect(validateSubmission(null).ok).toBe(false);
    expect(validateSubmission({ type: 'other', fields: { a: 'b' } }).ok).toBe(
      false,
    );
    expect(validateSubmission({ type: 'form', fields: {} }).ok).toBe(false);
    expect(
      validateSubmission({ type: 'form', fields: { email: 'nope' } }).ok,
    ).toBe(false);
    expect(
      validateSubmission({ type: 'form', fields: { 'bad key': 'x' } }).ok,
    ).toBe(false);
    expect(
      validateSubmission({ type: 'form', fields: { a: { nested: 1 } } }).ok,
    ).toBe(false);
    expect(
      validateSubmission({
        type: 'comment',
        fields: { name: 'A', message: 'm' },
      }).ok,
    ).toBe(false);
  });
  it('limits sizes and removes control characters', () => {
    const d = ok(
      validateSubmission({
        type: 'form',
        fields: { message: `a\u0000${'x'.repeat(5000)}` },
      }),
    ) as { fields: { message: string } };
    expect(d.fields.message.length).toBe(2000);
    expect(d.fields.message).not.toContain('\u0000');
    const many = Object.fromEntries(
      Array.from({ length: 25 }, (_, i) => [`f${i}`, 'v']),
    );
    expect(validateSubmission({ type: 'form', fields: many }).ok).toBe(false);
  });
});
