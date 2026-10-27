'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, Lock, AlertCircle, LogIn } from 'lucide-react';
import {
  type AsyncStateStatus,
  type ErrorType,
  AUTH_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
  resolveErrorType,
} from '@/lib/utils/asyncState';

export type { AsyncStateStatus, ErrorType };
export { AUTH_ERROR_MESSAGE, SERVER_ERROR_MESSAGE, resolveErrorType };

export interface AsyncStateViewProps {
  status: AsyncStateStatus;
  errorType?: ErrorType;
  errorMessage?: string;
  statusCode?: number;
  onRetry?: () => void;
  signInUrl?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  loadingMessage?: string;
  loadingComponent?: React.ReactNode;
  children?: React.ReactNode;
}

export function AsyncStateView({
  status,
  errorType: explicitErrorType,
  errorMessage,
  statusCode,
  onRetry,
  signInUrl = '/login',
  emptyTitle = 'No Items Found',
  emptyMessage = 'There are no records to display at this time.',
  emptyAction,
  emptyComponent,
  loadingMessage = 'Loading data...',
  loadingComponent,
  children,
}: AsyncStateViewProps) {
  // 1. Loading State
  if (status === 'loading') {
    if (loadingComponent) {
      return <div data-testid="async-loading-state">{loadingComponent}</div>;
    }
    return (
      <div
        data-testid="async-loading-state"
        className="py-16 sm:py-24 text-center space-y-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/5">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-400">{loadingMessage}</p>
      </div>
    );
  }

  // 2. Error State (Must NEVER look like empty data!)
  if (status === 'error') {
    const errorType = resolveErrorType(statusCode, explicitErrorType);

    // Case A: 401 or 403 Authentication / Authorization Error
    if (errorType === 'auth') {
      return (
        <div
          data-testid="async-auth-error-state"
          className="cosmic-card p-8 sm:p-12 rounded-3xl border border-red-500/30 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white text-center max-w-lg mx-auto space-y-4 shadow-2xl my-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400 inline-block mb-2">
              Authentication Required
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {AUTH_ERROR_MESSAGE}
            </h3>
            {errorMessage && (
              <p className="text-xs text-slate-400 mt-2 font-mono break-all">{errorMessage}</p>
            )}
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href={signInUrl}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in again</span>
            </Link>
          </div>
        </div>
      );
    }

    // Case B: 500 / Network / Server Error
    return (
      <div
        data-testid="async-server-error-state"
        className="cosmic-card p-8 sm:p-12 rounded-3xl border border-amber-500/30 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white text-center max-w-lg mx-auto space-y-4 shadow-2xl my-8"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 inline-block mb-2">
            Load Failure
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {SERVER_ERROR_MESSAGE}
          </h3>
          {errorMessage && (
            <p className="text-xs text-slate-400 mt-2 font-mono break-all">{errorMessage}</p>
          )}
        </div>
        <div className="pt-2 flex justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Empty State (Rendered ONLY after a successful empty response!)
  if (status === 'empty') {
    if (emptyComponent) {
      return <div data-testid="async-empty-state">{emptyComponent}</div>;
    }
    return (
      <div
        data-testid="async-empty-state"
        className="cosmic-card p-8 sm:p-12 rounded-3xl border border-white/10 text-center max-w-lg mx-auto space-y-4 my-8"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{emptyTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed max-w-sm mx-auto">
            {emptyMessage}
          </p>
        </div>
        {emptyAction && <div className="pt-2 flex justify-center">{emptyAction}</div>}
      </div>
    );
  }

  // 4. Success State
  return <>{children}</>;
}
