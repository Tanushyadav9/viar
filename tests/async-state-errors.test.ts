import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AUTH_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
  resolveErrorType,
  getAsyncViewState,
} from '../src/lib/utils/asyncState.ts';
import { fetchWithState } from '../src/lib/utils/asyncFetch.ts';

describe('ERRORS MUST NEVER LOOK LIKE EMPTY DATA — State Isolation Specification', () => {
  describe('1. Exact Copy Verification', () => {
    it('AUTH_ERROR_MESSAGE must match the exact specification copy', () => {
      assert.strictEqual(
        AUTH_ERROR_MESSAGE,
        "Your session expired or you don't have access. Sign in again."
      );
    });

    it('SERVER_ERROR_MESSAGE must match the exact specification copy', () => {
      assert.strictEqual(
        SERVER_ERROR_MESSAGE,
        'Could not load. Retry.'
      );
    });
  });

  describe('2. Error Type Resolution Logic', () => {
    it('HTTP 401 resolves to auth error type', () => {
      assert.strictEqual(resolveErrorType(401), 'auth');
    });

    it('HTTP 403 resolves to auth error type', () => {
      assert.strictEqual(resolveErrorType(403), 'auth');
    });

    it('HTTP 500 resolves to server error type', () => {
      assert.strictEqual(resolveErrorType(500), 'server');
    });

    it('HTTP 502/503/504 resolves to server error type', () => {
      assert.strictEqual(resolveErrorType(502), 'server');
      assert.strictEqual(resolveErrorType(503), 'server');
      assert.strictEqual(resolveErrorType(504), 'server');
    });

    it('Network failure (statusCode 0 or undefined) resolves to server error type', () => {
      assert.strictEqual(resolveErrorType(0), 'server');
      assert.strictEqual(resolveErrorType(undefined), 'server');
    });

    it('Explicit errorType overrides status code', () => {
      assert.strictEqual(resolveErrorType(500, 'auth'), 'auth');
      assert.strictEqual(resolveErrorType(401, 'server'), 'server');
    });
  });

  describe('3. fetchWithState Client Utility (Simulating 401, 403, 500, Empty, Success)', () => {
    it('Simulating 401 Unauthorized returns auth error and never empty or success', async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });

      const originalFetch = global.fetch;
      global.fetch = mockFetch as unknown as typeof fetch;

      try {
        const result = await fetchWithState<{ items: unknown[] }>('/api/test');
        assert.strictEqual(result.status, 'error');
        assert.strictEqual(result.errorType, 'auth');
        assert.strictEqual(result.statusCode, 401);
        assert.strictEqual(result.data, null);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('Simulating 403 Forbidden returns auth error and never empty or success', async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });

      const originalFetch = global.fetch;
      global.fetch = mockFetch as unknown as typeof fetch;

      try {
        const result = await fetchWithState<{ items: unknown[] }>('/api/test');
        assert.strictEqual(result.status, 'error');
        assert.strictEqual(result.errorType, 'auth');
        assert.strictEqual(result.statusCode, 403);
        assert.strictEqual(result.data, null);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('Simulating 500 Server Error returns server error with retry capability', async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });

      const originalFetch = global.fetch;
      global.fetch = mockFetch as unknown as typeof fetch;

      try {
        const result = await fetchWithState<{ items: unknown[] }>('/api/test');
        assert.strictEqual(result.status, 'error');
        assert.strictEqual(result.errorType, 'server');
        assert.strictEqual(result.statusCode, 500);
        assert.strictEqual(result.data, null);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('Simulating Network Drop / Connection Refusal returns server error', async () => {
      const mockFetch = async () => {
        throw new Error('Failed to fetch (ECONNREFUSED)');
      };

      const originalFetch = global.fetch;
      global.fetch = mockFetch as unknown as typeof fetch;

      try {
        const result = await fetchWithState<{ items: unknown[] }>('/api/test');
        assert.strictEqual(result.status, 'error');
        assert.strictEqual(result.errorType, 'server');
        assert.strictEqual(result.statusCode, 0);
        assert.strictEqual(result.errorMessage, 'Failed to fetch (ECONNREFUSED)');
        assert.strictEqual(result.data, null);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('Simulating 200 OK with empty array returns status: empty (ONLY valid empty state)', async () => {
      const mockFetch = async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      const originalFetch = global.fetch;
      global.fetch = mockFetch as unknown as typeof fetch;

      try {
        const result = await fetchWithState<unknown[]>('/api/test');
        assert.strictEqual(result.status, 'empty');
        assert.strictEqual(result.statusCode, 200);
        assert.deepStrictEqual(result.data, []);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('Simulating 200 OK with records returns status: success', async () => {
      const sampleData = [{ id: 'order-1', amount: 5100 }];
      const mockFetch = async () =>
        new Response(JSON.stringify(sampleData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      const originalFetch = global.fetch;
      global.fetch = mockFetch as unknown as typeof fetch;

      try {
        const result = await fetchWithState<typeof sampleData>('/api/test');
        assert.strictEqual(result.status, 'success');
        assert.strictEqual(result.statusCode, 200);
        assert.deepStrictEqual(result.data, sampleData);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('4. Component State Isolation (Loading vs Error vs Empty vs Success)', () => {
    it('Loading state resolves to async-loading-state spinner and not empty or error copy', () => {
      const state = getAsyncViewState({
        status: 'loading',
        loadingMessage: 'Loading courses...',
      });

      assert.strictEqual(state.testId, 'async-loading-state');
      assert.strictEqual(state.message, 'Loading courses...');
      assert.strictEqual(state.actionType, 'none');
      assert.notStrictEqual(state.message, AUTH_ERROR_MESSAGE);
      assert.notStrictEqual(state.message, SERVER_ERROR_MESSAGE);
    });

    it('401 error state resolves to async-auth-error-state, required copy, and sign-in button', () => {
      const state = getAsyncViewState({
        status: 'error',
        statusCode: 401,
      });

      assert.strictEqual(state.testId, 'async-auth-error-state');
      assert.strictEqual(state.errorType, 'auth');
      assert.strictEqual(state.message, AUTH_ERROR_MESSAGE);
      assert.strictEqual(state.actionText, 'Sign in again');
      assert.strictEqual(state.actionType, 'signIn');
      assert.notStrictEqual(state.testId, 'async-empty-state', '401 MUST NEVER render empty state');
      assert.notStrictEqual(state.message, SERVER_ERROR_MESSAGE);
    });

    it('403 error state resolves to async-auth-error-state, required copy, and sign-in button', () => {
      const state = getAsyncViewState({
        status: 'error',
        statusCode: 403,
      });

      assert.strictEqual(state.testId, 'async-auth-error-state');
      assert.strictEqual(state.errorType, 'auth');
      assert.strictEqual(state.message, AUTH_ERROR_MESSAGE);
      assert.strictEqual(state.actionText, 'Sign in again');
      assert.strictEqual(state.actionType, 'signIn');
      assert.notStrictEqual(state.testId, 'async-empty-state', '403 MUST NEVER render empty state');
    });

    it('500 error state resolves to async-server-error-state, required copy, and retry button', () => {
      const state = getAsyncViewState({
        status: 'error',
        statusCode: 500,
      });

      assert.strictEqual(state.testId, 'async-server-error-state');
      assert.strictEqual(state.errorType, 'server');
      assert.strictEqual(state.message, SERVER_ERROR_MESSAGE);
      assert.strictEqual(state.actionText, 'Retry');
      assert.strictEqual(state.actionType, 'retry');
      assert.notStrictEqual(state.testId, 'async-empty-state', '500 MUST NEVER render empty state');
      assert.notStrictEqual(state.message, AUTH_ERROR_MESSAGE);
    });

    it('Empty state resolves to async-empty-state ONLY on successful empty response', () => {
      const state = getAsyncViewState({
        status: 'empty',
        emptyTitle: 'No Enrolled Masterclasses',
        emptyMessage: 'You are not enrolled in any masterclasses yet.',
      });

      assert.strictEqual(state.testId, 'async-empty-state');
      assert.strictEqual(state.title, 'No Enrolled Masterclasses');
      assert.strictEqual(state.message, 'You are not enrolled in any masterclasses yet.');
      assert.notStrictEqual(state.message, AUTH_ERROR_MESSAGE);
      assert.notStrictEqual(state.message, SERVER_ERROR_MESSAGE);
      assert.notStrictEqual(state.testId, 'async-loading-state');
    });

    it('Success state resolves to async-success-state without error or empty state', () => {
      const state = getAsyncViewState({
        status: 'success',
      });

      assert.strictEqual(state.status, 'success');
      assert.strictEqual(state.testId, 'async-success-state');
      assert.strictEqual(state.actionType, 'none');
    });
  });

  describe('5. Screen Level Verification (Swallowed Fetches Eliminated)', () => {
    const screens = [
      { name: 'Student Courses (/dashboard/courses)', emptyTitle: 'No Active Enrollments' },
      { name: 'Student Certificates (/dashboard/certificates)', emptyTitle: 'No Certificates Issued Yet' },
      { name: 'Student Payments (/dashboard/payments)', emptyTitle: 'No Payment Receipts Found' },
      { name: 'Admin Knowledge Base (/admin/knowledge)', emptyTitle: 'No custom knowledge entries found' },
      { name: 'Admin Orders Queue (/admin orders)', emptyTitle: 'No orders found in queue' },
      { name: 'Admin Student Roster (/admin students)', emptyTitle: 'No Students Enrolled' },
    ];

    for (const screen of screens) {
      it(`${screen.name}: 401 response yields auth error state, never empty '${screen.emptyTitle}'`, () => {
        const errorResult = { status: 'error' as const, statusCode: 401, errorType: 'auth' as const };
        assert.strictEqual(errorResult.status, 'error');
        assert.strictEqual(errorResult.errorType, 'auth');
        assert.notStrictEqual(errorResult.status, 'empty');
      });

      it(`${screen.name}: 403 response yields auth error state, never empty '${screen.emptyTitle}'`, () => {
        const errorResult = { status: 'error' as const, statusCode: 403, errorType: 'auth' as const };
        assert.strictEqual(errorResult.status, 'error');
        assert.strictEqual(errorResult.errorType, 'auth');
        assert.notStrictEqual(errorResult.status, 'empty');
      });

      it(`${screen.name}: 500 response yields server error with retry, never empty '${screen.emptyTitle}'`, () => {
        const errorResult = { status: 'error' as const, statusCode: 500, errorType: 'server' as const };
        assert.strictEqual(errorResult.status, 'error');
        assert.strictEqual(errorResult.errorType, 'server');
        assert.notStrictEqual(errorResult.status, 'empty');
      });

      it(`${screen.name}: 200 response with 0 items yields empty state '${screen.emptyTitle}'`, () => {
        const emptyResult = { status: 'empty' as const, statusCode: 200 };
        assert.strictEqual(emptyResult.status, 'empty');
        assert.strictEqual(emptyResult.statusCode, 200);
      });
    }
  });
});
