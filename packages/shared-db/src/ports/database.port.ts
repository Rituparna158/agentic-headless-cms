export interface DatabasePort<T = unknown> {
  getDb(): T;
  healthCheck(timeoutMs?: number): Promise<void>;
  close(): Promise<void>;
}
