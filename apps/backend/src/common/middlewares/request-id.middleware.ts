import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Assigns a request ID — reusing one supplied by an upstream proxy/load
 * balancer if present, so a request can be traced end-to-end across
 * service boundaries, not just within this process (NFR-O-1). Echoed back
 * on the response so clients can report it when filing a bug.
 *
 * `req.id` is typed as pino-http's `ReqId` (`string | number | object`),
 * not `string` — pino-http owns that augmentation on `http.IncomingMessage`
 * (which `Request` extends), and re-augmenting it to a narrower type from
 * here doesn't reliably take effect across module boundaries. Since this
 * middleware always assigns a real string, callers that need a `string`
 * (e.g. the error handler) convert explicitly with `String(req.id)` rather
 * than relying on the declared type.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id =
    typeof incoming === 'string' && incoming.length > 0
      ? incoming
      : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
