import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'body.password',
    'body.token',
    'body.newPassword',
    'body.apiKey',
    'body.secretKey',
  ],
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
