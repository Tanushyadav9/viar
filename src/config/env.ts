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
    clerkWebhookSecret: string;
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

  // Payments (Direct UPI QR & Verification)
  payments: {
    upiVpa: string;
    payeeName: string;
    ownerWhatsApp: string;
    defaultTuitionInr: number;
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

  // Transactional Email (Resend or Mock)
  email: {
    provider: 'resend' | 'mock';
    apiKey: string;
    fromAddress: string;
    replyTo: string;
  };
}

function getEnvVar(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}


export const env: AppEnvConfig = {
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  appUrl: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),

  database: {
    url: getEnvVar('DATABASE_URL', ''),
    directUrl: getEnvVar('DIRECT_URL', ''),
  },

  redis: {
    url: getEnvVar('REDIS_URL', ''),
  },

  auth: {
    // // TODO: SWITCH BACK TO LIVE CLERK KEYS ONCE viar.in DNS IS VERIFIED
    // Must be set via environment variable (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY)
    // No fallback default keys allowed in code.
    clerkPublishableKey: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', ''),
    clerkSecretKey: getEnvVar('CLERK_SECRET_KEY', ''),
    clerkWebhookSecret: getEnvVar('CLERK_WEBHOOK_SECRET', ''),
    clerkSignInUrl: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_URL', '/sign-in'),
    ownerEmail: getEnvVar('OWNER_EMAIL', ''),
    superadminEmails: getEnvVar('SUPERADMIN_EMAILS', '')
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
    upiVpa: getEnvVar('UPI_VPA', 'aapkaastro@okaxis'),
    payeeName: getEnvVar('UPI_PAYEE_NAME', 'Vihangam Institute of Astrology and Research'),
    ownerWhatsApp: getEnvVar('OWNER_WHATSAPP', '919311215564'),
    defaultTuitionInr: Number(getEnvVar('DEFAULT_TUITION_INR', '5100')) || 5100,
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

  email: {
    provider: (getEnvVar('EMAIL_PROVIDER', 'resend') as 'resend' | 'mock'),
    apiKey: getEnvVar('RESEND_API_KEY', ''),
    // PLACEHOLDER: replace with client-approved sender details
    fromAddress: getEnvVar('EMAIL_FROM', 'Vihangam Institute of Astrology and Research <admissions@viar.in>'),
    replyTo: getEnvVar('EMAIL_REPLY_TO', 'aapkaastro1606@gmail.com'),
  },
};
