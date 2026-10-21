/**
 * Core async state management utilities, types, and copy constants.
 * 
 * Rules:
 * - 401 / 403: "Your session expired or you don't have access. Sign in again." with sign-in action.
 * - 500 / Network: "Could not load. Retry." with retry action.
 * - Empty: Shown ONLY after a successful 200 response with zero records.
 * - Loading: Distinct loading state.
 */

export type AsyncStateStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';
export type ErrorType = 'auth' | 'server';

export const AUTH_ERROR_MESSAGE = "Your session expired or you don't have access. Sign in again.";
export const SERVER_ERROR_MESSAGE = "Could not load. Retry.";

export function resolveErrorType(statusCode?: number, explicitType?: ErrorType): ErrorType {
  if (explicitType) return explicitType;
  if (statusCode === 401 || statusCode === 403) return 'auth';
  return 'server';
}

export interface AsyncViewState {
  status: AsyncStateStatus;
  errorType?: ErrorType;
  title?: string;
  message?: string;
  actionText?: string;
  actionType?: 'signIn' | 'retry' | 'none';
  testId: string;
}

export function getAsyncViewState(props: {
  status: AsyncStateStatus;
  errorType?: ErrorType;
  statusCode?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}): AsyncViewState {
  if (props.status === 'loading') {
    return {
      status: 'loading',
      message: props.loadingMessage || 'Loading data...',
      actionType: 'none',
      testId: 'async-loading-state',
    };
  }

  if (props.status === 'error') {
    const errType = resolveErrorType(props.statusCode, props.errorType);
    if (errType === 'auth') {
      return {
        status: 'error',
        errorType: 'auth',
        title: 'Authentication Required',
        message: AUTH_ERROR_MESSAGE,
        actionText: 'Sign in again',
        actionType: 'signIn',
        testId: 'async-auth-error-state',
      };
    }
    return {
      status: 'error',
      errorType: 'server',
      title: 'Load Failure',
      message: SERVER_ERROR_MESSAGE,
      actionText: 'Retry',
      actionType: 'retry',
      testId: 'async-server-error-state',
    };
  }

  if (props.status === 'empty') {
    return {
      status: 'empty',
      title: props.emptyTitle || 'No Items Found',
      message: props.emptyMessage || 'There are no records to display at this time.',
      actionType: 'none',
      testId: 'async-empty-state',
    };
  }

  return {
    status: 'success',
    actionType: 'none',
    testId: 'async-success-state',
  };
}
