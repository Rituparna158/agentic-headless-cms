import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      message:
        'Too many failed login attempts. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  statusCode: 429,
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      message:
        'Too many password reset requests. Please try again after 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  statusCode: 429,
});
