import { vi } from 'vitest';
vi.mock('../src/middlewares/global-auth.middleware.js', () => ({
  globalAuthMiddleware: (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => {
    req.headers['x-app-id'] = 'test-app';
    req.context = { ...req.context, applicationId: 'app-1' };
    next();
  },
}));
