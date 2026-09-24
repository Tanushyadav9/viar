/**
 * Production-ready Structured Error & Event Logger for Viar.in
 * Formats structured JSON logs for production (Vercel / Datadog / CloudWatch)
 * and readable messages for development.
 *
 * Automatically scrubs sensitive tokens/secrets and provides dedicated helpers
 * for payment failures, security events, and rate-limit violations.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface LogContext {
  service?: string;
  orderId?: string;
  paymentId?: string;
  cohortId?: string;
  studentEmail?: string;
  ip?: string;
  provider?: string;
  statusCode?: number;
  [key: string]: unknown;
}

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'keysecret',
  'webhooksecret',
  'token',
  'authorization',
  'card',
  'cvv',
]);

function scrubContext(ctx?: LogContext): LogContext | undefined {
  if (!ctx) return undefined;
  const scrubbed: LogContext = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      try {
        scrubbed[key] = JSON.parse(JSON.stringify(value));
      } catch {
        scrubbed[key] = String(value);
      }
    } else {
      scrubbed[key] = value;
    }
  }
  return scrubbed;
}

function formatError(err: unknown) {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };
  }
  return {
    message: String(err),
  };
}

class Logger {
  private isProd = process.env.NODE_ENV === 'production';

  private emit(level: LogLevel, message: string, context?: LogContext, err?: unknown) {
    const logData: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: scrubContext(context),
      error: formatError(err),
    };

    if (this.isProd) {
      // Structured JSON output for Vercel/Cloud logging
      const output = JSON.stringify(logData);
      if (level === 'error' || level === 'critical') {
        console.error(output);
      } else if (level === 'warn') {
        console.warn(output);
      } else {
        console.log(output);
      }
    } else {
      // Human-readable format in development
      const prefix = `[${logData.timestamp}] [${level.toUpperCase()}]`;
      const ctxStr = context && Object.keys(context).length > 0 ? ` | Context: ${JSON.stringify(logData.context)}` : '';
      if (level === 'critical' || level === 'error') {
        console.error(`${prefix} ${message}${ctxStr}`, err || '');
      } else if (level === 'warn') {
        console.warn(`${prefix} ${message}${ctxStr}`);
      } else {
        console.log(`${prefix} ${message}${ctxStr}`);
      }
    }
  }

  info(message: string, context?: LogContext) {
    this.emit('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.emit('warn', message, context);
  }

  error(message: string, err?: unknown, context?: LogContext) {
    this.emit('error', message, context, err);
  }

  critical(message: string, err?: unknown, context?: LogContext) {
    this.emit('critical', `🚨 [CRITICAL ALERT] ${message}`, context, err);
  }

  /**
   * Dedicated helper for payment transaction monitoring and alerts
   */
  paymentError(message: string, details: {
    orderId?: string;
    paymentId?: string;
    studentEmail?: string;
    amount?: number;
    provider?: string;
    cohortId?: string;
  }, err?: unknown) {
    this.critical(`Payment failure: ${message}`, err, {
      service: 'payments',
      ...details,
    });
  }

  /**
   * Dedicated helper for security events (rate limiting, signature invalidation, fraud)
   */
  securityAlert(message: string, details: {
    event: 'rate_limit_exceeded' | 'invalid_signature' | 'unauthorized_access' | 'input_tampering';
    ip?: string;
    identifier?: string;
    endpoint?: string;
    [key: string]: unknown;
  }) {
    this.warn(`🛡️ Security event: ${message}`, {
      service: 'security',
      ...details,
    });
  }
}

export const logger = new Logger();
