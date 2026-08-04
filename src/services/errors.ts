/**
 * Provider failures the UI needs to explain to the user.
 *
 * These are plain Errors with a `code` tag rather than Error subclasses —
 * `instanceof` on subclassed builtins is unreliable once the bundle is
 * transpiled for Hermes, and the UI only ever needs to switch on the code.
 */
export type ProviderErrorCode =
  | "missing-key"
  | "request-failed"
  | "geocode-failed";

export interface ProviderError extends Error {
  code: ProviderErrorCode;
  provider: string;
}

export function providerError(
  code: ProviderErrorCode,
  provider: string,
  message: string
): ProviderError {
  const err = new Error(message) as ProviderError;
  err.code = code;
  err.provider = provider;
  return err;
}

export function isProviderError(e: unknown): e is ProviderError {
  return e instanceof Error && typeof (e as ProviderError).code === "string";
}

/** A message safe to render straight into the UI. */
export function describeError(e: unknown): string {
  if (isProviderError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong fetching houses.";
}
