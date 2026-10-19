'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  GraduationCap, 
  ExternalLink, 
  ChevronDown, 
  Sun, 
  Moon,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { COMMON_TIMEZONES, getUserLocalTimezone } from '@/lib/timezones';
import { User } from '@/lib/types';
import { authProvider } from '@/lib/auth';
import AuthModal from './AuthModal';
import { useTheme } from './ThemeProvider';
import { LanguageSwitcher, useLanguage } from './LanguageContext';
import { useUser, useClerk } from '@clerk/nextjs';

export interface NavbarClientProps {
  serverAuth?: {
    isAuthenticated: boolean;
    isOwner: boolean;
    isStaff: boolean;
    showAdminNav: boolean;
    role?: string;
    email?: string | null;
  };
}

export default function NavbarClient({ serverAuth }: NavbarClientProps = {}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTz, setSelectedTz] = useState<string>('Asia/Kolkata');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { isSignedIn } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    setMounted(true);
    setCurrentUser(ViarStore.getCurrentUser());
    const savedTz = ViarStore.getTimezone() || getUserLocalTimezone();
    setSelectedTz(savedTz);

    const handleUserChange = () => {
      setCurrentUser(ViarStore.getCurrentUser());
    };
    window.addEventListener('user-role-changed', handleUserChange);
    return () => {
      window.removeEventListener('user-role-changed', handleUserChange);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Click outside to close user menu dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility: Escape key closes all open menus
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTzChange = (tz: string) => {
    setSelectedTz(tz);
    ViarStore.setTimezone(tz);
    window.dispatchEvent(new Event('timezone-changed'));
  };

  const handleSignOut = async () => {
    try {
      if (signOut) {
        await signOut({ redirectUrl: '/' });
      }
    } catch {
      // ignore
    }
    await authProvider.signOut();
    setCurrentUser(null);
    window.location.href = '/';
  };

  // Server-decided security boundary:
  // The Admin navigation link appears strictly for the Site Owner and authorized staff
  const isOwner = Boolean(serverAuth?.isOwner);
  const isStaff = Boolean(serverAuth?.isStaff);
  const showAdminNav = Boolean(serverAuth?.showAdminNav);
  const isAuthenticated = Boolean(serverAuth?.isAuthenticated || isSignedIn || currentUser);

  const navLinks = [
    {
      label: t('nav.courses', 'Courses'),
      shortLabel: t('nav.courses', 'Courses'),
      href: '/courses',
      active: pathname === '/courses',
    },
    {
      label: t('nav.flagship', 'Flagship Masterclass'),
      shortLabel: t('nav.flagship_short', 'Flagship'),
      href: '/courses/what-is-astrology',
      active: pathname === '/courses/what-is-astrology',
    },
    {
      label: t('nav.about', 'About Instructor'),
      shortLabel: t('nav.about_short', 'About'),
      href: '/about',
      active: pathname === '/about',
    },
    {
      label: t('nav.contact', 'Contact'),
      shortLabel: t('nav.contact', 'Contact'),
      href: '/contact',
      active: pathname === '/contact',
    },
    {
      label: t('nav.verify', 'Verify Certificate'),
      shortLabel: t('nav.verify_short', 'Verify'),
      href: '/verify',
      active: pathname.startsWith('/verify'),
    },
    ...(showAdminNav
      ? [
          {
            label: t('nav.admin', 'Admin Panel'),
            shortLabel: t('nav.admin_short', 'Admin'),
            href: '/admin',
            active: pathname.startsWith('/admin'),
          },
        ]
      : []),
  ];

  // Hydration-safe skeleton placeholder
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-md shadow-sm box-border">
        <div className="w-full max-w-[1400px] mx-auto px-6 h-16 sm:h-[68px] flex items-center gap-4 box-border">
          <Link href="/" className="shrink-0 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-[1px] shadow-sm shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-white dark:bg-[#07090e] rounded-[11px] flex items-center justify-center p-1">
                <Image
                  src="/images/logo-icon.png"
                  alt="VIAR Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 dark:text-white leading-none">
                  VIAR<span className="text-amber-500">.IN</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20 leading-none align-baseline">
                  Institute
                </span>
              </div>
            </div>
          </Link>
          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <span
                key={link.href}
                className="whitespace-nowrap px-2 xl:px-3 py-1.5 text-xs xl:text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0"
              >
                <span className="hidden xl:inline">{link.label}</span>
                <span className="inline xl:hidden">{link.shortLabel}</span>
              </span>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <div className="h-10 w-24 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            <div className="h-10 w-10 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            <Link
              href="/courses/what-is-astrology"
              className="gold-button h-10 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <span>Enroll Now</span>
            </Link>
          </div>
          <div className="flex lg:hidden items-center gap-2 shrink-0 ml-auto">
            <Link
              href="/courses/what-is-astrology"
              className="gold-button h-9 px-3 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <span>Enroll</span>
            </Link>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-md shadow-sm box-border">
      <div className="w-full max-w-[1400px] mx-auto px-6 h-16 sm:h-[68px] flex items-center gap-4 box-border">
        
        {/* =========================================================================
            ZONE 1: Logo & Brand Area (shrink-0)
            - Logo icon + VIAR.IN + INSTITUTE badge aligned on ONE baseline
            - Tagline visible strictly at >= 1280px (xl:flex), hidden at 1024-1279px and mobile
            - Tagline truncated with ellipsis to prevent wrapping or horizontal expansion
           ========================================================================= */}
        <Link
          href="/"
          className="shrink-0 flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl"
          aria-label="VIAR.IN - Vihangam Institute of Astrology and Research Home"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-[1px] shadow-sm shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-white dark:bg-[#07090e] rounded-[11px] flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/logo-icon.png"
                alt="VIAR Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 dark:text-white leading-none">
                VIAR<span className="text-amber-500">.IN</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20 leading-none align-baseline">
                Institute
              </span>
            </div>
            {/* Tagline: Visible strictly on >= 1280px (xl:flex), hidden on 1024-1279px and mobile */}
            <p className="hidden xl:flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[320px] mt-1 leading-none">
              <span className="truncate">Vihangam Institute of Astrology &amp; Research</span>
              <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
              <span className="text-slate-400 dark:text-slate-500 shrink-0">By</span>
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open('https://aapkaastro.com', '_blank', 'noopener,noreferrer');
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5 font-semibold cursor-pointer shrink-0 transition-colors"
                title="Aapka Astro Consultation Practice"
              >
                Aapka Astro
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </span>
            </p>
          </div>
        </Link>

        {/* =========================================================================
            ZONE 2: Centered Navigation (flex: 1 1 auto, min-width 0, centered, hidden < 1024px)
            - Flex: 1 with justify-center centers nav between logo and right actions
            - 1024-1279px: reduced gaps (gap-1) and compact labels for comfortable fit
            - >=1280px: full gaps (gap-2) and standard text size
            - Focus states for keyboard accessibility
           ========================================================================= */}
        <nav
          className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-1 xl:gap-2"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap px-2 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0 ${
                link.active
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-white/5 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className="hidden xl:inline">{link.label}</span>
              <span className="inline xl:hidden">{link.shortLabel}</span>
            </Link>
          ))}
        </nav>

        {/* =========================================================================
            ZONE 3: Right-Side Actions (Desktop: hidden lg:flex, shrink-0, gap: 8px)
            Strictly 3 items visible on desktop:
            1. Language toggle (English / हिन्दी)
            2. Dark mode toggle (Sun / Moon)
            3. Primary CTA (Enroll Now when unauthenticated; User Account Menu when authenticated)
           ========================================================================= */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          
          {/* 1. Language Switcher (EN / HI) */}
          <LanguageSwitcher />

          {/* 2. Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-amber-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* 3. Primary CTA Button (Unauthenticated: Enroll Now | Authenticated: Consolidated User Menu) */}
          {!isAuthenticated ? (
            <Link
              href="/courses/what-is-astrology"
              className="gold-button h-10 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <span>Enroll Now</span>
            </Link>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`h-10 px-3.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2 shrink-0 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  showAdminNav
                    ? 'text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
                    : 'gold-button'
                }`}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label="User Account Menu"
              >
                {showAdminNav ? (
                  <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <GraduationCap className="w-4 h-4 shrink-0" />
                )}
                <span>{showAdminNav ? (isOwner ? 'Owner Console' : 'Staff Console') : 'Student Portal'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.name || (isOwner ? 'Acharya Niraj Kumar' : 'Student Account')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {serverAuth?.email || currentUser?.email || 'Authenticated'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {isOwner ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-500 shrink-0" />
                          Site Owner
                        </span>
                      ) : isStaff ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0" />
                          Staff
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-emerald-500 shrink-0" />
                          Student
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    {showAdminNav ? (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Open Admin Console</span>
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Go to Student Portal</span>
                      </Link>
                    )}
                  </div>

                  {/* Settings / Timezone Switch in dropdown */}
                  <div className="pt-2 pb-1 border-t border-slate-100 dark:border-white/10 px-3">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Display Timezone
                    </label>
                    <select
                      value={selectedTz}
                      onChange={(e) => handleTzChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                    >
                      {COMMON_TIMEZONES.map((t) => (
                        <option key={t.tz} value={t.tz} className="bg-slate-900 text-white">
                          {t.label} ({t.offset})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-white/10">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            ZONE 4: Mobile & Tablet Bar Controls (< 1024px, lg:hidden)
            - Primary compact CTA button
            - Accessible Hamburger menu toggle button
           ========================================================================= */}
        <div className="flex lg:hidden items-center gap-2 shrink-0 ml-auto">
          {!isAuthenticated ? (
            <Link
              href="/courses/what-is-astrology"
              className="gold-button h-9 px-3 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <span>Enroll</span>
            </Link>
          ) : (
            <Link
              href={showAdminNav ? '/admin' : '/dashboard'}
              className="gold-button h-9 px-3 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {showAdminNav ? (
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{showAdminNav ? 'Admin' : 'Portal'}</span>
            </Link>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
            aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-amber-500" />
            ) : (
              <Menu className="w-5 h-5 text-amber-500" />
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          ZONE 5: Mobile & Tablet Slide-Down Drawer (< 1024px, lg:hidden)
          - Contains all nav links with active highlights
          - Language switcher (English / हिन्दी)
          - Theme toggle (Light / Dark)
          - Display timezone select
          - Account sign-in / portal / sign-out actions
         ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/80 dark:border-white/10 bg-white/98 dark:bg-[#07090e]/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-xl">
          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  link.active
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-white/5 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{link.label}</span>
                <span className="text-xs text-amber-500">&rarr;</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Controls: Language & Theme */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Theme</span>
              <button
                onClick={toggleTheme}
                className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Mobile Timezone Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Display Timezone
            </label>
            <div className="relative">
              <select
                value={selectedTz}
                onChange={(e) => handleTzChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              >
                {COMMON_TIMEZONES.map((t) => (
                  <option key={t.tz} value={t.tz} className="bg-slate-900 text-white">
                    {t.label} ({t.offset})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex flex-col gap-2">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/courses/what-is-astrology"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="gold-button w-full py-2.5 rounded-xl text-xs font-bold shadow-md text-center block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  Enroll in Masterclass Now
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  Sign In to Account
                </Link>
              </>
            ) : (
              <>
                {showAdminNav ? (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 text-center block shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    {isOwner ? 'Site Owner Admin Console' : 'Admin Console'}
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="gold-button w-full py-2.5 rounded-xl text-xs font-bold text-center block shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    Go to Student Portal
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setCurrentUser(ViarStore.getCurrentUser());
        }}
      />
    </header>
  );
}
