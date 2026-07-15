import type { AppEvents } from '../../types/events.types.js';
import EventEmitter2Package from 'eventemitter2';
const { EventEmitter2 } = EventEmitter2Package;

class TypedEventEmitter extends EventEmitter2 {
  public emit<K extends keyof AppEvents>(
    event: K,
    ...values: Parameters<AppEvents[K]>
  ): boolean {
    return super.emit(event, ...values);
  }

  public on<K extends keyof AppEvents>(event: K, listener: AppEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void) as this;
  }
}

export const eventBus = new TypedEventEmitter({
  wildcard: true,
  delimiter: '.',
  newListener: false,
  removeListener: false,
  maxListeners: 20,
  verboseMemoryLeak: true,
  ignoreErrors: false,
});
