export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function ok<T>(data: T): Result<T> {
  return { success: true, data }
}

export function err(error: string): Result<never> {
  return { success: false, error }
}
