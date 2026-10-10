/** Every API error body is { detail: string, code?: string }. */
export type ApiErrorBody = { detail?: string; code?: string; errors?: unknown; min_version?: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.detail ?? `Request failed (${status})`);
    this.name = 'ApiError';
  }

  get code(): string | undefined {
    return this.body.code;
  }
}

/** Throws ApiError for openapi-fetch results that carry an error. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(result.response.status, (result.error ?? {}) as ApiErrorBody);
  }
  return result.data as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && /Network request failed|fetch failed/.test(err.message)) {
    return "Can't reach Vine. Check your connection and try again.";
  }
  // In development builds, show the real error so problems can be diagnosed from the phone.
  if (__DEV__) {
    console.warn('[api]', err);
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return `Something went wrong (${detail})`;
  }
  return 'Something went wrong. Please try again.';
}
