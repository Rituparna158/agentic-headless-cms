import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const mfaVerifySchema = z.object({
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

export const mfaChallengeSchema = z.object({
  mfaToken: z.string().min(1, 'MFA Token is required'),
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
});
