// Test-only stand-in for utils/intlPolyfill.ts (see jest.config.js
// moduleNameMapper). The real module exists to patch Hermes's broken
// Intl/timezone behavior on-device — Node's Jest environment already has
// full native Intl support, and the real module's raw ESM .js imports
// from @formatjs aren't transformable under this project's jest transform
// config, so tests don't need (and can't load) it.
export {};
