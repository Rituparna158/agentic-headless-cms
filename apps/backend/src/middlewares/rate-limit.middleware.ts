import rateLimit from 'express-rate-limit';
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      message: 'Too many attempts. Please try again after 1 minute.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  statusCode: 429,
});
