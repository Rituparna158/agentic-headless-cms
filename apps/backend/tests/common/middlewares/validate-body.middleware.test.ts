import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validateBody } from '../../../src/common/middlewares/validate-body.middleware.js';
import type { Request, Response, NextFunction } from 'express';

describe('validateBody Middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    count: z.number().int().default(0),
  });

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRes = {};
    mockNext = vi.fn();
  });

  it('replaces req.body with the parsed/defaulted output and calls next() on valid input', () => {
    mockReq = { body: { name: 'widget' } };

    const middleware = validateBody(schema);
    middleware(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockReq.body).toEqual({ name: 'widget', count: 0 });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('forwards a ZodError to next() on invalid input, without mutating req.body', () => {
    mockReq = { body: { name: '' } };

    const middleware = validateBody(schema);
    middleware(
      mockReq as Request,
      mockRes as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
    const forwardedError = mockNext.mock.calls[0]?.[0];
    expect(forwardedError).toBeInstanceOf(z.ZodError);
    expect(mockReq.body).toEqual({ name: '' });
  });
});
