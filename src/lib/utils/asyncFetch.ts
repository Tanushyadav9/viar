/**
 * Utility for performing safe client-side fetch requests with distinct
 * Loading, Error (401/403 vs 500/network), Empty, and Success states.
 * 
 * Rules:
 * - 401 / 403: Sets errorType: 'auth' ("Your session expired or you don't have access. Sign in again.")
 * - 500 / Network: Sets errorType: 'server' ("Could not load. Retry.")
 * - 200 OK with 0 items: Sets status: 'empty'
 * - 200 OK with items: Sets status: 'success'
 */

export type AsyncFetchStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';
export type AsyncErrorType = 'auth' | 'server';

export interface AsyncFetchResult<T> {
  status: 'success' | 'empty' | 'error';
  errorType?: AsyncErrorType;
  statusCode: number;
  data: T | null;
  errorMessage?: string;
}

export async function fetchWithState<T>(
  url: string,
  options?: RequestInit,
  checkIsEmpty?: (data: T) => boolean
): Promise<AsyncFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const statusCode = res.status;

    if (statusCode === 401 || statusCode === 403) {
      const errJson = await res.json().catch(() => null);
      return {
        status: 'error',
        errorType: 'auth',
        statusCode,
        data: null,
        errorMessage: errJson?.error,
      };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return {
        status: 'error',
        errorType: 'server',
        statusCode,
        data: null,
        errorMessage: errJson?.error,
      };
    }

    const data: T = await res.json();
    const isEmpty = checkIsEmpty
      ? checkIsEmpty(data)
      : Array.isArray(data)
      ? data.length === 0
      : false;

    return {
      status: isEmpty ? 'empty' : 'success',
      statusCode: 200,
      data,
    };
  } catch (err) {
    return {
      status: 'error',
      errorType: 'server',
      statusCode: 0,
      data: null,
      errorMessage: err instanceof Error ? err.message : undefined,
    };
  }
}
