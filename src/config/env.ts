/**
 * Viar.in Typed Environment Configuration Module
 * 
 * All secrets (API keys, DB URLs, provider tokens) are read and validated here.
 * Never access process.env directly elsewhere in the codebase.
 */

export interface AppEnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  appUrl: string;

  // Database (PostgreSQL / Neon)
  database: {
    url: string;
    directUrl: string;
  };

  // Cache & Scheduling (Redis)
  redis: {
    url: string;
  };

  // Authentication (Clerk Multi-Domain SSO + Local fallback)
  auth: {
    clerkPublishableKey: string;
    clerkSecretKey: string;
    clerkDomain: string;
    clerkIsSatellite: boolean;
    clerkSignInUrl: string;
    ownerEmail: string;
    superadminEmails: string[];
  };

  // Email Sign-Up Policy (Anti-Abuse / Domain Restrictions)
  emailPolicy: {
    mode: 'BLOCKLIST' | 'ALLOWLIST';
    allowlist: string[];
    blocklistExtra: string[];
  };

  // Payments (Razorpay India & Stripe International)
  payments: {
    enableStripe: boolean;
    razorpay: {
      keyId: string;
      keySecret: string;
    };
    stripe: {
      publishableKey: string;
      secretKey: string;
      webhookSecret: string;
    };
  };

  // Video Hosting (Cloudflare Stream or Mux)
  video: {
    provider: 'cloudflare' | 'mux' | 'direct';
    cloudflare: {
      accountId: string;
      apiToken: string;
      customerSubdomain: string;
    };
    mux: {
      tokenId: string;
      tokenSecret: string;
    };
  };
}

function getEnvVar(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

function getBooleanEnvVar(key: string, fallback: boolean = false): boolean {
  const val = process.env[key];
  if (val === undefined || val === '') return fallback;
  return val.toLowerCase() === 'true' || val === '1';
}

export const env: AppEnvConfig = {
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  appUrl: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),

  database: {
    url: getEnvVar('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/viar_db?schema=public'),
    directUrl: getEnvVar('DIRECT_URL', ''),
  },

  redis: {
    url: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
  },

  auth: {
    clerkPublishableKey: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', ''),
    clerkSecretKey: getEnvVar('CLERK_SECRET_KEY', ''),
    clerkDomain: getEnvVar('NEXT_PUBLIC_CLERK_DOMAIN', 'viar.in'),
    clerkIsSatellite: getBooleanEnvVar('NEXT_PUBLIC_CLERK_IS_SATELLITE', true),
    clerkSignInUrl: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_URL', '/sign-in'),
    ownerEmail: getEnvVar('OWNER_EMAIL', 'ask@aapkaastro.com'),
    superadminEmails: getEnvVar('SUPERADMIN_EMAILS', 'ask@aapkaastro.com,admin@viar.in,niraj@aapkaastro.com')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  },

  emailPolicy: {
    mode: (getEnvVar('EMAIL_SIGNUP_POLICY_MODE', 'BLOCKLIST').toUpperCase() as 'BLOCKLIST' | 'ALLOWLIST') || 'BLOCKLIST',
    allowlist: getEnvVar(
      'EMAIL_SIGNUP_ALLOWLIST',
      'gmail.com,yahoo.com,outlook.com,hotmail.com,icloud.com,proton.me,protonmail.com,live.com,aol.com,zoho.com'
    )
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean),
    blocklistExtra: getEnvVar('EMAIL_SIGNUP_BLOCKLIST_EXTRA', '')
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean),
  },

  payments: {
    // Graceful toggle: Stripe is only considered enabled if ENABLE_STRIPE is true AND keys exist
    enableStripe:
      getBooleanEnvVar('ENABLE_STRIPE', false) &&
      Boolean(getEnvVar('STRIPE_SECRET_KEY', '')) &&
      Boolean(getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', '')),

    razorpay: {
      keyId: getEnvVar('NEXT_PUBLIC_RAZORPAY_KEY_ID', getEnvVar('RAZORPAY_KEY_ID', 'rzp_test_placeholder_key')),
      keySecret: getEnvVar('RAZORPAY_KEY_SECRET', 'rzp_test_secret_placeholder'),
    },

    stripe: {
      publishableKey: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', ''),
      secretKey: getEnvVar('STRIPE_SECRET_KEY', ''),
      webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', ''),
    },
  },

  video: {
    provider: (getEnvVar('VIDEO_HOSTING_PROVIDER', 'cloudflare') as 'cloudflare' | 'mux' | 'direct'),
    cloudflare: {
      accountId: getEnvVar('CLOUDFLARE_STREAM_ACCOUNT_ID', ''),
      apiToken: getEnvVar('CLOUDFLARE_STREAM_API_TOKEN', ''),
      customerSubdomain: getEnvVar('CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN', ''),
    },
    mux: {
      tokenId: getEnvVar('MUX_TOKEN_ID', ''),
      tokenSecret: getEnvVar('MUX_TOKEN_SECRET', ''),
    },
  },
};
