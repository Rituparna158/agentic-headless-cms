export function initConsoleSuppression(
  isProduction: boolean = import.meta.env.MODE === 'production',
): void {
  if (isProduction) {
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    console.warn = noop;
    console.error = noop;
    console.trace = noop;
  }
}

// Automatically invoke on module evaluation
initConsoleSuppression();
