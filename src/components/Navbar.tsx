'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Globe, 
  ShieldCheck, 
  GraduationCap, 
  ExternalLink, 
  ChevronDown, 
  Clock, 
  Sun, 
  Moon,
  Menu,
  X
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { COMMON_TIMEZONES, getUserLocalTimezone } from '@/lib/timezones';
import { User } from '@/lib/types';
import { authProvider } from '@/lib/auth';
import AuthModal from './AuthModal';
import { useTheme } from './ThemeProvider';
import { LanguageSwitcher, useLanguage } from './LanguageContext';
import { useUser, useClerk } from '@clerk/nextjs';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTz, setSelectedTz] = useState<string>('Asia/Kolkata');
  const [isTzOpen, setIsTzOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tzRef = useRef<HTMLDivElement>(null);

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
    setIsTzOpen(false);
  }, [pathname]);

  // Click outside to close timezone dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tzRef.current && !tzRef.current.contains(event.target as Node)) {
        setIsTzOpen(false);
      }
    }
    if (isTzOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTzOpen]);

  const handleTzChange = (tz: string) => {
    setSelectedTz(tz);
    ViarStore.setTimezone(tz);
    setIsTzOpen(false);
    // Dispatch storage event so other components update their timezone
    window.dispatchEvent(new Event('timezone-changed'));
  };

  const { isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();

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

  const navLinks = [
    { label: t('nav.courses', 'Courses'), href: '/courses', active: pathname === '/courses' },
    { label: t('nav.flagship', 'Flagship Cohort'), href: '/courses/what-is-astrology', active: pathname === '/courses/what-is-astrology' },
    { label: t('nav.about', 'About Instructor'), href: '/about', active: pathname === '/about' },
    { label: t('nav.contact', 'Contact'), href: '/contact', active: pathname === '/contact' },
    { label: t('nav.verify', 'Verify'), href: '/verify', active: pathname.startsWith('/verify') },
  ];

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-md">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-4">
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
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 dark:text-white">
                  VIAR<span className="text-amber-500">.IN</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20 leading-none">
                  Institute
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap mt-1 leading-none">
                Vihangam Institute of Astrology &amp; Research
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/courses/what-is-astrology"
              className="gold-button whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-bold shadow-md"
            >
              Enroll Now
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const effectiveEmail = clerkEmail || currentUser?.email?.toLowerCase();
  const isOwner = Boolean(
    effectiveEmail &&
    (effectiveEmail === 'aapkaastro1606@gmail.com' || currentUser?.isOwner || currentUser?.role === 'OWNER')
  );
  const isAuthenticated = Boolean(isSignedIn || currentUser);
  const isAdmin = isOwner || currentUser?.role === 'ADMIN' || currentUser?.role === 'INSTRUCTOR';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-md">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-3 xl:gap-6">
        
        {/* 1. Logo and Brand Section */}
        <Link href="/" className="shrink-0 flex items-center gap-2.5 sm:gap-3 group focus:outline-none">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-[1px] shadow-sm shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-white dark:bg-[#07090e] rounded-[11px] flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/logo-icon.png"
                alt="VIAR - Vihangam Institute of Astrology and Research"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 dark:text-white">
                VIAR<span className="text-amber-500">.IN</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/20 leading-none">
                Institute
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap mt-1 leading-none flex items-center gap-1">
              <span className="hidden sm:inline">Vihangam Institute of Astrology &amp; Research</span>
              <span className="sm:hidden">Vihangam Institute</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-400 dark:text-slate-500">By</span>
              <a 
                href="https://aapkaastro.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e) => e.stopPropagation()}
                className="text-amber-600 dark:text-amber-300 hover:underline flex items-center gap-0.5 font-semibold transition-colors"
                title="Aapka Astro Consultation Practice"
              >
                Aapka Astro
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>
            </p>
          </div>
        </Link>

        {/* 2 - 6. Primary Horizontal Navigation (Desktop: lg+) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-lg transition-colors ${
                link.active
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-white/5 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 7 - 10. Utility & Action Controls (Desktop: lg+) */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0">
          
          {/* Language Switcher (EN / HI) */}
          <LanguageSwitcher />

          {/* 7. Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-amber-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* 8. Timezone Selector */}
          <div className="relative" ref={tzRef}>
            <button
              onClick={() => setIsTzOpen(!isTzOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors whitespace-nowrap"
              title="Change your local display timezone for scheduled classes"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="max-w-[85px] xl:max-w-[125px] truncate">
                {COMMON_TIMEZONES.find((t) => t.tz === selectedTz)?.label || selectedTz}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isTzOpen && (
              <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-amber-500/20 shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    Select Your Timezone
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    All course timestamps and assessment windows will convert automatically.
                  </p>
                </div>
                {COMMON_TIMEZONES.map((t) => (
                  <button
                    key={t.tz}
                    onClick={() => handleTzChange(t.tz)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      selectedTz === t.tz
                        ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.offset}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 9 & 10. Sign In & Enroll Now / Authenticated State */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/courses/what-is-astrology"
                className="gold-button whitespace-nowrap px-3.5 xl:px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <span>Enroll Now</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isOwner ? (
                <Link
                  href="/admin"
                  className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap hover:bg-amber-500/30 transition"
                  title="Site Owner Console"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Site Owner</span>
                </Link>
              ) : currentUser?.staffSections && currentUser.staffSections.length > 0 ? (
                <span className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Staff</span>
                </span>
              ) : (
                <span className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Student</span>
                </span>
              )}

              {isOwner ? (
                <Link
                  href="/admin"
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-900/30 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Admin Console</span>
                </Link>
              ) : isAdmin || (currentUser?.staffSections && currentUser.staffSections.length > 0) ? (
                <Link
                  href="/instructor"
                  className="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-900/30 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Instructor Suite</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="gold-button whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Portal</span>
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors"
                title="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          )}

        </div>

        {/* Mobile / Tablet Controls (< lg) */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Language Switcher on mobile */}
          <LanguageSwitcher />

          {/* Theme Toggle on mobile */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-amber-600" />
            )}
          </button>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-amber-500" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (< lg) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/80 dark:border-white/10 bg-white/98 dark:bg-[#07090e]/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-xl">
          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors flex items-center justify-between ${
                  link.active
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-white/5 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{link.label}</span>
                {link.active && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
              </Link>
            ))}
          </nav>

          {/* Mobile Language Switcher */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Language / भाषा
            </span>
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
                  className="gold-button w-full py-2.5 rounded-xl text-xs font-bold shadow-md text-center block"
                >
                  Enroll in Masterclass Now
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 block"
                >
                  Sign In to Account
                </Link>
              </>
            ) : (
              <>
                {isOwner ? (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 text-center block shadow-md"
                  >
                    Site Owner Admin Console
                  </Link>
                ) : isAdmin || (currentUser?.staffSections && currentUser.staffSections.length > 0) ? (
                  <Link
                    href="/instructor"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 text-center block shadow-md"
                  >
                    Go to Instructor Suite
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="gold-button w-full py-2.5 rounded-xl text-xs font-bold text-center block shadow-md"
                  >
                    Go to Student Portal
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
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
