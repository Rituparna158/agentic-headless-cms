export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface StructuredLogEntry {
  level: Exclude<LogLevel, 'silent'>;
  message: string;
  timestamp: string;
  module?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

export type TelemetryTransport = (entry: StructuredLogEntry) => void;

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'apikey',
  'secretkey',
  'newpassword',
  'authorization',
  'cookie',
  'refreshtoken',
]);

function redactSensitiveData(data: unknown, depth = 0): unknown {
  if (depth > 5) return '[Truncated]';
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[Redacted]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = redactSensitiveData(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export function isProductionEnvironment(): boolean {
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'production'
  ) {
    return true;
  }
  if (
    typeof import.meta !== 'undefined' &&
    Boolean((import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD)
  ) {
    return true;
  }
  if (
    typeof window !== 'undefined' &&
    ((window as unknown as { __CMS_PROD__?: boolean }).__CMS_PROD__ === true ||
      (window as unknown as { __ENV__?: { NODE_ENV?: string } }).__ENV__
        ?.NODE_ENV === 'production')
  ) {
    return true;
  }
  return false;
}

export class BrowserLogger {
  private level: LogLevel = 'info';
  private module?: string;
  private transports: TelemetryTransport[] = [];

  constructor(moduleName?: string, level?: LogLevel) {
    this.module = moduleName;
    this.level =
      level ??
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
        ? 'warn'
        : isProductionEnvironment()
          ? 'silent'
          : 'info');
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public addTransport(transport: TelemetryTransport): void {
    this.transports.push(transport);
  }

  public createChild(subModule: string): BrowserLogger {
    const childName = this.module ? `${this.module}:${subModule}` : subModule;
    const child = new BrowserLogger(childName, this.level);
    this.transports.forEach((t) => child.addTransport(t));
    return child;
  }

  private shouldLog(targetLevel: Exclude<LogLevel, 'silent'>): boolean {
    if (this.level === 'silent') return false;
    const priority: Record<Exclude<LogLevel, 'silent'>, number> = {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40,
    };
    const currentMin =
      priority[this.level as Exclude<LogLevel, 'silent'>] || 20;
    return priority[targetLevel] >= currentMin;
  }

  private buildEntry(
    level: Exclude<LogLevel, 'silent'>,
    message: string,
    metaOrError?: unknown,
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      module: this.module,
    };

    if (metaOrError instanceof Error) {
      entry.error = {
        name: metaOrError.name,
        message: metaOrError.message,
        stack: metaOrError.stack,
      };
    } else if (typeof metaOrError === 'object' && metaOrError !== null) {
      const sanitized = redactSensitiveData(metaOrError) as Record<
        string,
        unknown
      >;
      // If error is embedded in object
      if (sanitized.error instanceof Error) {
        entry.error = {
          name: sanitized.error.name,
          message: sanitized.error.message,
          stack: sanitized.error.stack,
        };
        delete sanitized.error;
      }
      entry.metadata = sanitized;
    } else if (metaOrError !== undefined) {
      entry.metadata = { value: metaOrError };
    }

    return entry;
  }

  private emit(
    level: Exclude<LogLevel, 'silent'>,
    message: string,
    metaOrError?: unknown,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.buildEntry(level, message, metaOrError);

    // Dispatch to registered telemetry transports
    for (const transport of this.transports) {
      try {
        transport(entry);
      } catch {
        // Silently swallow telemetry transport errors to not interrupt app execution
      }
    }

    // Console output for development/client debugging
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]${this.module ? ` [${this.module}]` : ''}:`;
    const consoleArgs: unknown[] = [prefix, message];

    if (entry.metadata) {
      consoleArgs.push(entry.metadata);
    }
    if (entry.error) {
      consoleArgs.push(entry.error.stack || entry.error.message);
    }

    switch (level) {
      case 'debug':
        console.debug(...consoleArgs);
        break;
      case 'info':
        console.info(...consoleArgs);
        break;
      case 'warn':
        console.warn(...consoleArgs);
        break;
      case 'error':
        console.error(...consoleArgs);
        break;
    }
  }

  public debug(message: string, metaOrError?: unknown): void {
    this.emit('debug', message, metaOrError);
  }

  public info(message: string, metaOrError?: unknown): void {
    this.emit('info', message, metaOrError);
  }

  public warn(message: string, metaOrError?: unknown): void {
    this.emit('warn', message, metaOrError);
  }

  public error(message: string, metaOrError?: unknown): void {
    this.emit('error', message, metaOrError);
  }
}

export const browserLogger = new BrowserLogger(
  'cms-client',
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
    ? 'warn'
    : 'info',
);

export function createBrowserLogger(moduleName?: string): BrowserLogger {
  return new BrowserLogger(moduleName);
}
