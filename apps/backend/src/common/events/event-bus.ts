import { createRequire } from 'node:module';

// eventemitter2's runtime is CJS-only (`module.exports = EventEmitter`,
// with `EventEmitter2` attached as a static property on the constructor
// for backwards compat) while its .d.ts declares ESM-style named + default
// exports — a real mismatch between the published types and the actual
// module shape. `import { EventEmitter2 } from 'eventemitter2'` type-checks
// (trusting the .d.ts) and even passes under Vitest (esbuild's lenient CJS
// interop), but resolves to `undefined` under Node's actual ESM loader
// (`tsx watch` / `node --env-file`), since the static property assignment
// isn't statically analyzable by cjs-module-lexer. `createRequire` forces
// real CJS resolution, which does see the property, sidestepping the
// ESM/CJS ambiguity entirely.
const require = createRequire(import.meta.url);
const { EventEmitter2 } =
  require('eventemitter2') as typeof import('eventemitter2');

import type { AppEvents } from '../../types/events.types.js';

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
