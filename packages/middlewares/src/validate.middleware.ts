import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ApiError } from '@repo/utils';

export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        next(new ApiError(400, 'Validation Error', errors));
      } else {
        next(new ApiError(500, 'Internal Server Error'));
      }
    }
  };
};
