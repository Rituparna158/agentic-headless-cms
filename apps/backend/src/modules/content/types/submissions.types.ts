export type SubmissionResult =
  | { ok: true; data: Record<string, unknown>; spam: false }
  | { ok: true; spam: true }
  | { ok: false; error: string };
