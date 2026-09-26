export interface AuthUser {
  id: string; // Primary unique identifier (e.g. Clerk user ID: usr_...)
  name: string;
  email?: string;
  phone?: string;
  role: 'STUDENT' | 'ADMIN' | 'INSTRUCTOR' | 'OWNER';
  isOwner?: boolean;
  timezone?: string;
  avatarUrl?: string;
  enrolledCohortIds: string[];
}

/**
 * Unified Multi-Domain Authentication Provider (Clerk Ecosystem)
 * Single free authentication approach across Viar.in, AapkaAstro.com, and DOW Consulting:
 * - Email / Password sign-in and sign-up
 * - Google OAuth Single Sign-On
 * - No Phone OTP (zero SMS costs / no India DLT registration overhead)
 * - Multi-domain / Satellite SSO configuration
 */
export interface AuthProvider {
  readonly name: string;
  
  /**
   * Get current authenticated session user
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Sign in with Email & Password (for all students)
   */
  signInWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }>;

  /**
   * Create account with Email & Password
   */
  signUpWithEmail(
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }>;

  /**
   * Initiate Google OAuth Single Sign-On via Clerk
   */
  signInWithGoogle(options?: {
    redirectUrl?: string;
    redirectUrlComplete?: string;
  }): Promise<{ success: boolean; redirectUrl?: string; error?: string }>;

  /**
   * Dormant / Optional extension point: Request OTP to phone number
   * (Disabled by default to avoid SMS costs; can be enabled purely in Clerk config without architectural changes)
   */
  sendPhoneOtp?(phone: string): Promise<{ success: boolean; message: string }>;

  /**
   * Dormant / Optional extension point: Verify OTP code
   */
  verifyPhoneOtp?(
    phone: string,
    otp: string,
    name?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }>;

  /**
   * Sign out current session
   */
  signOut(): Promise<void>;
}
