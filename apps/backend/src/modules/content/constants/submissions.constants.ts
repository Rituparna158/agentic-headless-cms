/**
 * What a website visitor may send: a contact/newsletter form, or a comment.
 * Everything is treated as plain text and size-limited; it is stored as a
 * draft entry that a person must look at (and, for comments, approve).
 */
export const SUBMISSION_LIMITS = {
  fields: 20,
  key: 40,
  value: 2000,
  name: 80,
  email: 200,
  message: 2000,
  form: 40,
  slug: 200,
} as const;

export const LIMITS = SUBMISSION_LIMITS;

export const EMAIL_REGEX = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export const EMAIL = EMAIL_REGEX;
