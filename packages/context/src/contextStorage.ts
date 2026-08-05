import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId?: string;
  agentId?: string;
  ip?: string;
  mcpToolName?: string;
  promptRef?: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();
