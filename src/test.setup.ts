// Vitest setup — runs before every test file.
// Keep this minimal; add jest-dom matchers here if/when components need them.

// jsdom lacks ResizeObserver, which R3F / drei touch at import time in some paths.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;
}
