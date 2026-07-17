// firebase-js-sdk's own TypeScript typings for 'firebase/auth' don't declare
// getReactNativePersistence (it's a known, long-standing gap — see
// https://github.com/firebase/firebase-js-sdk/issues/9316 — the function
// exists and works at runtime, only the .d.ts is missing it). This
// augmentation adds the type back instead of suppressing the error inline.
import "firebase/auth";

declare module "firebase/auth" {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
