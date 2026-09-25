'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Globe, 
  ShieldCheck, 
  GraduationCap, 
  ExternalLink,
  ChevronDown,
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import { COMMON_TIMEZONES, getUserLocalTimezone } from '@/lib/timezones';
import { User } from '@/lib/types';
import { authProvider } from '@/lib/auth';
import AuthModal from './AuthModal';
import { useTheme } from './ThemeProvider';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTz, setSelectedTz] = useState<string>('Asia/Kolkata');
  const [isTzOpen, setIsTzOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const handleTzChange = (tz: string) => {
    setSelectedTz(tz);
    ViarStore.setTimezone(tz);
    setIsTzOpen(false);
    // Dispatch storage event so other components update their timezone
    window.dispatchEvent(new Event('timezone-changed'));
  };

  const handleSignOut = async () => {
    await authProvider.signOut();
    setCurrentUser(null);
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#07090e]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold tracking-tight text-amber-500">VIAR<span className="text-slate-900 dark:text-white">.IN</span></span>
          </div>
        </div>
      </header>
    );
  }

  const isOwner = currentUser?.role === 'OWNER' || currentUser?.isOwner;
  const isAdmin = isOwner || currentUser?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#07090e]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand & Lineage */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="group flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-[1px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-white dark:bg-[#07090e] rounded-[11px] flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-950/40 transition">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-wider text-slate-900 dark:text-white">
                  VIAR<span className="text-amber-500">.IN</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-300 border border-amber-400/20">
                  Academy
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span>By</span>
                <a 
                  href="https://aapkaastro.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-amber-300/90 hover:text-amber-200 underline decoration-amber-400/30 flex items-center gap-0.5 transition"
                >
                  Aapka Astro <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              </p>
            </div>
          </Link>

          {/* Primary Nav */}
          <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-white/10">
            <Link
              href="/courses"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/courses'
                  ? 'text-amber-400 bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Courses
            </Link>
            <Link
              href="/courses/what-is-astrology"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/courses/what-is-astrology'
                  ? 'text-amber-400 bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Flagship Cohort
            </Link>
            <Link
              href="/about"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/about'
                  ? 'text-amber-400 bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              About Instructor
            </Link>
            <Link
              href="/contact"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname === '/contact'
                  ? 'text-amber-400 bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Contact
            </Link>
            <Link
              href="/verify"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                pathname.startsWith('/verify')
                  ? 'text-amber-400 bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Verify
            </Link>
          </nav>
        </div>

        {/* Right Controls: Theme Toggle, Timezone, Role Toggle, Dashboard CTA */}
        <div className="flex items-center space-x-3">
          
          {/* Theme Toggle (Light / Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-amber-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Timezone Selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTzOpen(!isTzOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition"
              title="Change your local display timezone for scheduled classes"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="max-w-[110px] sm:max-w-[140px] truncate">
                {COMMON_TIMEZONES.find((t) => t.tz === selectedTz)?.label || selectedTz}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isTzOpen && (
              <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl bg-[#0f172a] border border-amber-500/20 shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    Select Your Timezone
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All 18 live class schedules will convert automatically.
                  </p>
                </div>
                {COMMON_TIMEZONES.map((t) => (
                  <button
                    key={t.tz}
                    onClick={() => handleTzChange(t.tz)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                      selectedTz === t.tz
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.offset}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authenticated User or Guest Controls */}
          {!currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                Sign In
              </Link>
              <Link
                href="/courses/what-is-astrology"
                className="gold-button px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <span>Enroll Now</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Role Badge */}
              {currentUser.isOwner ? (
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Site Owner</span>
                </span>
              ) : currentUser.staffSections && currentUser.staffSections.length > 0 ? (
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Staff</span>
                </span>
              ) : (
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Student</span>
                </span>
              )}

              {/* Portal Navigation CTA */}
              {isAdmin || (currentUser.staffSections && currentUser.staffSections.length > 0) ? (
                <Link
                  href="/instructor"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-900/30 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Instructor Suite</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="gold-button px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Portal</span>
                </Link>
              )}

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
                title="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          )}

        </div>
      </div>

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
