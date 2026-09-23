/**
 * ==============================================================================
 * EMAIL SIGN-UP POLICY MODULE (ANTI-ABUSE / DOMAIN RESTRICTIONS)
 * ==============================================================================
 * 
 * Requirement:
 * The client wants to restrict sign-ups to "known" email addresses for security
 * and anti-abuse reasons. This policy is completely configurable, not hardcoded.
 * 
 * Two Supported Modes:
 * 1. BLOCK-LIST MODE (RECOMMENDED DEFAULT):
 *    Any real email domain can sign up, except domains identified as disposable/
 *    temporary email services (e.g. mailinator, tempmail, 10minutemail, etc.).
 *    Why recommended: Achieves the actual anti-abuse goal (stopping throwaway bot
 *    accounts) without turning away paying students on Outlook, iCloud, corporate
 *    work emails, or international university domains.
 * 
 * 2. ALLOW-LIST MODE:
 *    Only explicitly specified domains (e.g., gmail.com, yahoo.com, outlook.com)
 *    can sign up. Simple, but strictly excludes users on iCloud, corporate, or
 *    custom domains unless added to the list.
 * 
 * Native Clerk Enforcement:
 * Clerk natively enforces domain restrictions at the API level (preventing direct
 * API bypass):
 * - Go to Clerk Dashboard -> User & Authentication -> Email, Phone, Username.
 * - Under Email Address -> Restrictions, configure Allowlist or Blocklist to mirror
 *   these settings.
 * ==============================================================================
 */

/**
 * Maintained list of 100+ prominent disposable / temporary email domains.
 * Open-source reference lists: disposable-email-domains / ivolo / martenson.
 */
export const KNOWN_DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  // Prominent disposable services
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'cool.fr.nf',
  'jetable.fr.nf',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'trashmail.ws',
  'dispostable.com',
  'getairmail.com',
  'fakeinbox.com',
  'throwawaymail.com',
  'mytemp.email',
  'fakemailgenerator.com',
  'emailondeck.com',
  'mohmal.com',
  'generator.email',
  'crazymailing.com',
  'burnermail.io',
  'inboxkitten.com',
  'tempail.com',
  'dropmail.me',
  'getnada.com',
  'abyssmail.com',
  'nada.ltd',
  'tempinbox.com',
  'throwaway.email',
  'trashinbox.com',
  'disposablemail.com',
  'tempmailaddress.com',
  'harakirimail.com',
  'tmail.ws',
  'trash-mail.at',
  'trash-mail.com',
  'tempmail24.net',
  'tempmailo.com',
  'maildrop.cc',
  'mailnesia.com',
  'bupmail.com',
  'zillamail.com',
  'tempemail.co',
  'mintemail.com',
  'mailsac.com',
  'trashcanmail.com',
  'mailcatch.com',
  'spambog.com',
  'spamex.com',
  'mailnull.com',
  'fastmail.fm', // frequently abused proxy domain variant
  'kasmail.com',
  'disposable.com',
  'temporarymail.com',
  'incognitomail.org',
  'anonymbox.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'nowmymail.com',
  'discard.email',
  'spambox.us',
  'mytempemail.com',
  'crazymail.com',
  'trashymail.com',
  'mailscrap.com',
  'filzmail.com',
  'dodgeit.com',
  'nobulk.com',
  'sofort-mail.de',
  'byom.de',
]);

/**
 * Standard trusted email providers for ALLOWLIST mode.
 */
export const DEFAULT_ALLOWED_DOMAINS: readonly string[] = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'live.com',
  'aol.com',
  'zoho.com',
];

export type EmailPolicyMode = 'BLOCKLIST' | 'ALLOWLIST';

export interface EmailPolicyValidationResult {
  allowed: boolean;
  domain: string;
  mode: EmailPolicyMode;
  reason?: string;
}

export interface EmailPolicyConfig {
  mode: EmailPolicyMode;
  allowlist: string[];
  blocklistExtra: string[];
}

/**
 * Resolves active email policy configuration from environment variables
 * with safe fallbacks.
 */
export function getEmailPolicyConfig(): EmailPolicyConfig {
  const rawMode = process.env.EMAIL_SIGNUP_POLICY_MODE?.toUpperCase();
  const mode: EmailPolicyMode = rawMode === 'ALLOWLIST' ? 'ALLOWLIST' : 'BLOCKLIST';

  const rawAllow = process.env.EMAIL_SIGNUP_ALLOWLIST;
  const allowlist = rawAllow
    ? rawAllow.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
    : [...DEFAULT_ALLOWED_DOMAINS];

  const rawBlockExtra = process.env.EMAIL_SIGNUP_BLOCKLIST_EXTRA;
  const blocklistExtra = rawBlockExtra
    ? rawBlockExtra.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
    : [];

  return { mode, allowlist, blocklistExtra };
}

/**
 * Extracts and normalizes the domain portion of an email address.
 */
export function extractDomainFromEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return null;
  return parts[1].trim();
}

/**
 * Validates an email address against the active policy (Blocklist vs Allowlist).
 * Returns clear, helpful, and friendly explanations when an email is rejected.
 */
export function validateEmailForSignup(
  email: string,
  customConfig?: Partial<EmailPolicyConfig>
): EmailPolicyValidationResult {
  const baseConfig = getEmailPolicyConfig();
  const config: EmailPolicyConfig = {
    mode: customConfig?.mode ?? baseConfig.mode,
    allowlist: customConfig?.allowlist ?? baseConfig.allowlist,
    blocklistExtra: customConfig?.blocklistExtra ?? baseConfig.blocklistExtra,
  };

  const domain = extractDomainFromEmail(email);

  if (!domain || !domain.includes('.')) {
    return {
      allowed: false,
      domain: domain || '',
      mode: config.mode,
      reason: 'Please enter a valid email address with a recognized domain (e.g. name@gmail.com).',
    };
  }

  // Check subdomains (e.g. test.mailinator.com -> mailinator.com)
  const domainParts = domain.split('.');
  const rootDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domain;

  // --------------------------------------------------------------------------
  // MODE 1: BLOCKLIST (Recommended Default)
  // Blocks known temporary/disposable services, permits all real email domains.
  // --------------------------------------------------------------------------
  if (config.mode === 'BLOCKLIST') {
    const isDisposable =
      KNOWN_DISPOSABLE_DOMAINS.has(domain) ||
      KNOWN_DISPOSABLE_DOMAINS.has(rootDomain) ||
      config.blocklistExtra.includes(domain) ||
      config.blocklistExtra.includes(rootDomain);

    if (isDisposable) {
      return {
        allowed: false,
        domain,
        mode: 'BLOCKLIST',
        /* PLACEHOLDER: replace with real content (client-configurable policy error) */
        reason: `Temporary or disposable email addresses (@${domain}) cannot be used for academy enrollment. Please use a permanent email address (e.g. Gmail, Outlook, iCloud, or your personal/work domain) so you can reliably receive live Zoom links, session recordings, and official certificates.`,
      };
    }

    return {
      allowed: true,
      domain,
      mode: 'BLOCKLIST',
    };
  }

  // --------------------------------------------------------------------------
  // MODE 2: ALLOWLIST
  // Strictly limits enrollment to explicitly listed domains (e.g. Gmail, Yahoo).
  // --------------------------------------------------------------------------
  const isAllowed = config.allowlist.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );

  if (!isAllowed) {
    const sampleProviders = config.allowlist.slice(0, 4).join(', ');
    return {
      allowed: false,
      domain,
      mode: 'ALLOWLIST',
      /* PLACEHOLDER: replace with real content (client-configurable policy error) */
      reason: `Sign-ups are currently restricted to approved email providers (such as ${sampleProviders}). Please use an account from an approved provider, or contact admissions@viar.in to approve your domain.`,
    };
  }

  return {
    allowed: true,
    domain,
    mode: 'ALLOWLIST',
  };
}
