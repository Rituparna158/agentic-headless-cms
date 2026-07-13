export interface DatabasePort<T = any> {
  getDb(): T;
  healthCheck(timeoutMs?: number): Promise<void>;
  close(): Promise<void>;
}
