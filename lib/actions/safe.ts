/**
 * Server Action Safety Utilities
 *
 * Next.js sanitises thrown errors in production builds — the client
 * receives "An error occurred in the Server Components render" instead
 * of the real message.  These helpers let actions RETURN error objects
 * so the client can display meaningful feedback.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Detects internal Next.js errors (redirect, notFound) that must be
 * re-thrown so the framework can handle them.
 */
export function isNextInternalError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const digest = (error as Error & { digest?: string }).digest;
  return (
    typeof digest === 'string' &&
    (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND'))
  );
}

/**
 * Converts a caught error into a safe `{ success: false, error }` object
 * that can be returned to the client.
 */
export function actionError(error: unknown): { success: false; error: string } {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    console.error('[ServerAction]', (error as Error).message);
  }
  return {
    success: false,
    error:
      error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}

/**
 * Shorthand for the success return when there is no payload.
 */
export function actionOk(): { success: true };
export function actionOk<T>(data: T): { success: true; data: T };
export function actionOk<T>(data?: T) {
  if (data !== undefined) return { success: true, data } as const;
  return { success: true } as const;
}

/* ------------------------------------------------------------------ */
/*  Form Action Helper                                                  */
/* ------------------------------------------------------------------ */

/**
 * Wraps a server action so it can be passed as a form `action` prop
 * without TypeScript complaining about the return type.
 * React form actions must return `void | Promise<void>`.
 */
export function asFormAction<A extends any[]>(
  fn: (...args: A) => Promise<any>,
): (...args: A) => Promise<void> {
  return async (...args: A) => {
    await fn(...args);
  };
}
