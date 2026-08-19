import { Request, Response, NextFunction } from 'express';
import { contextStorage, RequestContext } from '@repo/context';
export const contextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const store: RequestContext = {
    get userId() {
      return (req as Request & { user?: { id: string } }).user?.id;
    },
    get agentId() {
      return req.headers['x-agent-id'] as string;
    },
    get ip() {
      return req.ip;
    },
    get mcpToolName() {
      return req.headers['x-mcp-tool-name'] as string;
    },
    get promptRef() {
      return req.headers['x-prompt-ref'] as string;
    },
    get applicationId() {
      return req.context?.applicationId as string | undefined;
    },
  };
  contextStorage.run(store, () => next());
};
