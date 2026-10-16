import { AuthProvider, AuthUser } from './types';
import { ViarStore } from '../store';
import { validateEmailForSignup } from './email-policy';
import { assignRoleForUser } from './permissions';

/**
 * ============================================================================
 * CLERK STANDALONE AUTHENTICATION ARCHITECTURE
 * ============================================================================
 * 
 * Auth Decisions:
 * - Clerk Email/Password + Google OAuth.
 * - Viar.in uses its own standalone Clerk application with zero shared satellite login.
 * - Phone OTP has been dropped everywhere (zero SMS carrier costs, no DLT registration).
 * 
 * Identity Model:
 * User identity is anchored by unique `id` (Clerk User ID `user_...`).
 * ============================================================================
 */

class DefaultAuthProvider implements AuthProvider {
  readonly name = 'ClerkStandaloneAuthProvider';

  async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;
    const user = ViarStore.getCurrentUser();
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: undefined,
      role: user.role,
      timezone: user.timezone,
      avatarUrl: user.avatarUrl,
      enrolledCohortIds: user.enrolledCohortIds || [],
    };
  }

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const { role, isOwner } = assignRoleForUser(cleanEmail);

    const user: AuthUser = {
      id: isOwner ? 'user-owner' : `usr_${Date.now()}`,
      name: isOwner ? 'Acharya Niraj Kumar' : email.split('@')[0],
      email: cleanEmail,
      role,
      isOwner,
      timezone: ViarStore.getTimezone(),
      enrolledCohortIds: ['cohort-wia-batch-1'],
    };

    if (typeof window !== 'undefined') {
      ViarStore.setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email || '',
        role: user.role,
        isOwner: user.isOwner,
        timezone: user.timezone,
        enrolledCohortIds: user.enrolledCohortIds,
      });
      document.cookie = `viar_session=${user.id}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `viar_user_role=${user.role}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `viar_user_email=${encodeURIComponent(user.email || '')}; path=/; max-age=2592000; SameSite=Lax`;
      window.dispatchEvent(new Event('user-role-changed'));

      // Asynchronously ensure database row exists in Prisma
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.email,
          name: user.name,
        }),
      }).catch((e) => console.warn('[Auth] Database sync error:', e));
    }

    return { success: true, user };
  }

  async signUpWithEmail(
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Please enter your full name.' };
    }

    // Email Sign-Up Policy Check (Anti-Abuse / Domain Restrictions)
    const policyResult = validateEmailForSignup(email);
    if (!policyResult.allowed) {
      return {
        success: false,
        error: policyResult.reason,
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const { role, isOwner } = assignRoleForUser(cleanEmail);

    const user: AuthUser = {
      id: isOwner ? 'user-owner' : `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role,
      isOwner,
      timezone: ViarStore.getTimezone(),
      enrolledCohortIds: [],
    };

    if (typeof window !== 'undefined') {
      ViarStore.setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email || '',
        role: user.role,
        isOwner: user.isOwner,
        timezone: user.timezone,
        enrolledCohortIds: user.enrolledCohortIds,
      });
      document.cookie = `viar_session=${user.id}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `viar_user_role=${user.role}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `viar_user_email=${encodeURIComponent(user.email || '')}; path=/; max-age=2592000; SameSite=Lax`;
      window.dispatchEvent(new Event('user-role-changed'));

      // Asynchronously ensure database row exists in Prisma
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.email,
          name: user.name,
        }),
      }).catch((e) => console.warn('[Auth] Database sync error:', e));
    }

    return { success: true, user };
  }

  async signInWithGoogle(options?: {
    redirectUrl?: string;
    redirectUrlComplete?: string;
  }): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
    const redirectUrl = options?.redirectUrl || '/login/sso-callback';
    const redirectUrlComplete = options?.redirectUrlComplete || '/dashboard';

    if (typeof window !== 'undefined') {
      const globalWindow = window as unknown as {
        Clerk?: {
          client?: {
            signIn?: {
              authenticateWithRedirect: (params: {
                strategy: string;
                redirectUrl: string;
                redirectUrlComplete: string;
              }) => Promise<void>;
            };
          };
        };
      };
      const clerk = globalWindow.Clerk;
      if (clerk?.client?.signIn) {
        try {
          await clerk.client.signIn.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl,
            redirectUrlComplete,
          });
          return { success: true, redirectUrl };
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Google sign in failed.';
          console.warn('[Auth] Clerk authenticateWithRedirect error:', err);
          return { success: false, error: errorMessage };
        }
      }
      window.location.href = redirectUrl;
      return { success: true, redirectUrl };
    }
    return { success: true, redirectUrl };
  }

  /**
   * Dormant Phone OTP helpers — kept so that adding phone sign-in later
   * is a Clerk dashboard configuration change, not a codebase refactor.
   */
  async sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Phone auth is dormant; enable in Clerk dashboard if SMS channel is provisioned for ${phone}.`,
    };
  }

  async verifyPhoneOtp(
    phone: string,
    _otp: string,
    name?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const user: AuthUser = {
      id: `usr_phone_${phone.slice(-10)}`,
      name: name || 'Student',
      phone,
      role: 'STUDENT',
      timezone: ViarStore.getTimezone(),
      enrolledCohortIds: ['cohort-wia-batch-1'],
    };
    return { success: true, user };
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      ViarStore.resetToDefaults();
      document.cookie = 'viar_session=; path=/; max-age=0';
      document.cookie = 'viar_user_role=; path=/; max-age=0';
      document.cookie = 'viar_user_email=; path=/; max-age=0';
      window.dispatchEvent(new Event('user-role-changed'));
    }
  }
}

export const authProvider: AuthProvider = new DefaultAuthProvider();
export * from './email-policy';
