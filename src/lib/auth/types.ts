export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'STUDENT' | 'ADMIN' | 'INSTRUCTOR';
  timezone?: string;
  avatarUrl?: string;
  enrolledCohortIds: string[];
}

export interface AuthProvider {
  readonly name: string;
  
  /**
   * Get current authenticated session user
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Indian Students: Request OTP to phone number
   */
  sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string }>;

  /**
   * Indian Students: Verify 6-digit OTP and establish session
   */
  verifyPhoneOtp(
    phone: string,
    otp: string,
    name?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }>;

  /**
   * International Students: Sign in with Email & Password
   */
  signInWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }>;

  /**
   * International Students: Initiate Google OAuth Single Sign-On
   */
  signInWithGoogle(): Promise<{ success: boolean; redirectUrl?: string }>;

  /**
   * Sign out current session
   */
  signOut(): Promise<void>;
}
