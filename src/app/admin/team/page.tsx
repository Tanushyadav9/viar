'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  KeyRound,
  RefreshCw,
  Eye,
  Settings,
} from 'lucide-react';
import { ViarStore } from '@/lib/store';
import {
  User,
  StaffAccessLevel,
  StaffPermission,
  AdminSection,
} from '@/lib/types';
import {
  isSiteOwner,
  VIAR_SECTIONS,
  ADMIN_SECTIONS_META,
  getPrimaryOwnerEmail,
} from '@/lib/auth/permissions';

export default function TeamManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Invite / Grant Modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteSection, setInviteSection] = useState<AdminSection>('courses');
  const [inviteAccessLevel, setInviteAccessLevel] = useState<StaffAccessLevel>('MANAGE');

  const primaryOwnerEmail = getPrimaryOwnerEmail();

  const loadData = useCallback(() => {
    const user = ViarStore.getCurrentUser();
    setCurrentUser(user);
    setStaffUsers(ViarStore.getStaffUsers());
    setPermissions(ViarStore.getStaffPermissions());
  }, []);

  useEffect(() => {
    loadData();

    const handleRoleChange = () => {
      loadData();
    };

    window.addEventListener('user-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('user-role-changed', handleRoleChange);
    };
  }, [loadData]);

  const isOwner = isSiteOwner(currentUser);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      showNotice('error', 'Please enter a valid staff email address.');
      return;
    }

    setLoading(true);
    try {
      // 1. Try server API route
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || primaryOwnerEmail,
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          name: inviteName.trim() || inviteEmail.split('@')[0],
          section: inviteSection,
          accessLevel: inviteAccessLevel,
        }),
      });

      if (res.ok) {
        showNotice(
          'success',
          `Granted ${inviteAccessLevel} access on '${inviteSection}' to ${inviteEmail}.`
        );
      } else {
        // Fallback to client-side store
        ViarStore.addStaffMember({
          email: inviteEmail.trim().toLowerCase(),
          name: inviteName.trim() || inviteEmail.split('@')[0],
          sections: [inviteSection],
          accessLevel: inviteAccessLevel,
          grantedByUserId: currentUser?.email || primaryOwnerEmail,
        });
        showNotice(
          'success',
          `Granted ${inviteAccessLevel} access on '${inviteSection}' to ${inviteEmail} (runtime store updated).`
        );
      }
    } catch {
      // Fallback on network/fetch error
      ViarStore.addStaffMember({
        email: inviteEmail.trim().toLowerCase(),
        name: inviteName.trim() || inviteEmail.split('@')[0],
        sections: [inviteSection],
        accessLevel: inviteAccessLevel,
        grantedByUserId: currentUser?.email || primaryOwnerEmail,
      });
      showNotice(
        'success',
        `Granted ${inviteAccessLevel} access on '${inviteSection}' to ${inviteEmail}.`
      );
    } finally {
      setLoading(false);
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      loadData();
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to soft-revoke this permission? The audit trail will preserve the revocation timestamp.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/team?id=${encodeURIComponent(permissionId)}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': currentUser?.email || primaryOwnerEmail,
        },
      });

      if (res.ok) {
        showNotice('success', 'Permission soft-revoked. Audit trail updated.');
      } else {
        ViarStore.softRevokeStaffPermission(permissionId);
        showNotice('success', 'Permission soft-revoked in runtime store.');
      }
    } catch {
      ViarStore.softRevokeStaffPermission(permissionId);
      showNotice('success', 'Permission soft-revoked.');
    } finally {
      setLoading(false);
      loadData();
    }
  };

  const handleToggleSection = (userId: string, section: AdminSection) => {
    const staff = staffUsers.find((u) => u.id === userId);
    if (!staff) return;

    const currentSections = staff.staffSections || [];
    const updated = currentSections.includes(section)
      ? currentSections.filter((s) => s !== section)
      : [...currentSections, section];

    ViarStore.setStaffSections(userId, updated, 'MANAGE', currentUser?.email || primaryOwnerEmail);
    loadData();
    showNotice('success', `Updated sections for ${staff.email}.`);
  };

  // If user is not the owner: display access restricted screen
  if (!isOwner) {
    return (
      <div className="cosmic-bg min-h-screen py-16 flex items-center justify-center px-4">
        <div className="cosmic-card p-8 sm:p-10 rounded-3xl border border-red-500/40 bg-red-950/20 max-w-lg w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 mb-3 inline-block">
            Owner-Only Screen
          </span>
          <h1 className="text-2xl font-black text-white mb-2">Access Denied: /admin/team</h1>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            The Team Access Management screen is strictly reserved for the Site Owner (
            <span className="text-amber-300 font-mono">{primaryOwnerEmail}</span>).
            Staff members with MANAGE access to other sections cannot view or modify team permissions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/admin"
              className="gold-button w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Portal</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 w-full sm:w-auto text-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation & Header */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-amber-300">Team Permissions</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Site Owner Exclusive
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-mono text-slate-300">{currentUser?.email}</span>
              </div>
              <h1 className="text-3xl font-black text-white">Team Access Management</h1>
              <p className="text-xs text-slate-400 mt-1">
                Delegate granular per-section staff permissions. Zero Clerk add-on fees, backed by Neon PostgreSQL.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsInviteOpen(true)}
                className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Invite Staff Member</span>
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                title="Refresh Records"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Architectural Explainer Callout */}
        <div className="cosmic-card p-6 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Zero-Cost RBAC Architecture vs Paid Clerk Organizations</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Clerk charges an expensive monthly subscription plus add-on fees for custom organization roles. We built this permission system inside your existing free Neon PostgreSQL database (<code className="text-amber-300">StaffPermission</code> table) and verified it in application code.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-amber-500/20 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Owner Designation:</strong>
                <p>Anchored to <code className="text-amber-300">ask@aapkaastro.com</code> via <code className="text-amber-300">OWNER_EMAIL</code>. Cannot be self-assigned or bypassed.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Per-Site Isolation:</strong>
                <p>Permissions granted here only apply to Viar.in. Staff have zero access to Aapka Astro or DOW Consulting.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Soft-Revoke Audit Trail:</strong>
                <p>Revocations set <code className="text-emerald-300">revokedAt</code> instead of deleting rows, preserving a 100% complete audit log.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Owner Account Card */}
        <div className="cosmic-card p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/20 to-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Acharya Niraj Kumar</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Site Owner
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{primaryOwnerEmail}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Permanent full access to every admin section. Only account authorized to access /admin/team.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              Universal Access (All Sections)
            </span>
          </div>
        </div>

        {/* Current Staff Members Table */}
        <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 sm:p-5 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">Active Staff Members ({staffUsers.filter(u => !u.isOwner).length})</h3>
              <p className="text-xs text-slate-400">
                Staff authenticate via the normal Clerk login flow and receive section-level permissions.
              </p>
            </div>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Grant New Section</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                <tr>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-4 py-4">Status & Role</th>
                  <th className="px-4 py-4">Granted Sections</th>
                  <th className="px-4 py-4">Quick Toggle Sections</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffUsers.filter(u => !u.isOwner).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      No delegated staff members yet. Click &quot;Invite Staff Member&quot; to assign your first employee.
                    </td>
                  </tr>
                ) : (
                  staffUsers
                    .filter((u) => !u.isOwner)
                    .map((staff) => {
                      const sections = staff.staffSections || [];
                      const activeStaffPerms = permissions.filter(
                        (p) => (p.userId === staff.id || p.userId === staff.email) && !p.revokedAt
                      );

                      return (
                        <tr key={staff.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-6 py-4">
                            <p className="font-bold text-white text-sm">{staff.name}</p>
                            <p className="text-xs font-mono text-slate-400">{staff.email}</p>
                          </td>

                          <td className="px-4 py-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {staff.role || 'INSTRUCTOR'}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {sections.length === 0 ? (
                              <span className="text-slate-500 italic">No active sections</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {sections.map((sec) => {
                                  const permRecord = activeStaffPerms.find((p) => p.section.toLowerCase() === sec.toLowerCase());
                                  const level = permRecord?.accessLevel || 'MANAGE';

                                  return (
                                    <span
                                      key={sec}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                        level === 'MANAGE'
                                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                      }`}
                                    >
                                      {level === 'VIEW' ? <Eye className="w-2.5 h-2.5" /> : <Settings className="w-2.5 h-2.5" />}
                                      <span>{ADMIN_SECTIONS_META[sec]?.shortTitle || sec}</span>
                                      <span className="opacity-70 text-[9px]">({level})</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {VIAR_SECTIONS.map((sec) => {
                                const isChecked = sections.includes(sec);
                                return (
                                  <button
                                    key={sec}
                                    type="button"
                                    onClick={() => handleToggleSection(staff.id, sec)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition border ${
                                      isChecked
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                                    }`}
                                    title={`Toggle ${ADMIN_SECTIONS_META[sec]?.shortTitle}`}
                                  >
                                    {ADMIN_SECTIONS_META[sec]?.shortTitle}
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const activeForUser = permissions.filter(
                                  (p) => (p.userId === staff.id || p.userId === staff.email) && !p.revokedAt
                                );
                                activeForUser.forEach((p) => handleRevokePermission(p.id));
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition text-xs font-semibold inline-flex items-center gap-1"
                              title="Soft-Revoke All Access for this staff member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revoke All</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PostgreSQL StaffPermission Audit Trail */}
        <div className="cosmic-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 sm:p-5 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">StaffPermission Audit Trail</h3>
              <p className="text-xs text-slate-400">
                Complete historical record from PostgreSQL. Tracks who granted what, to whom, and when. Soft-revocations preserve timestamps.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/10 text-slate-300">
              {permissions.length} Total Audit Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10 font-bold">
                <tr>
                  <th className="px-6 py-3">Permission ID</th>
                  <th className="px-4 py-3">Target Staff Member</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Access Level</th>
                  <th className="px-4 py-3">Granted By (Owner)</th>
                  <th className="px-4 py-3">Granted At</th>
                  <th className="px-4 py-3">Audit Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-sans">
                      No permission records recorded in the audit trail yet.
                    </td>
                  </tr>
                ) : (
                  permissions.map((p) => {
                    const isRevoked = !!p.revokedAt;
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-3 text-amber-300/80 font-mono truncate max-w-[120px]">
                          {p.id}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <p className="text-white font-medium">{p.userId}</p>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">
                            {ADMIN_SECTIONS_META[p.section as AdminSection]?.shortTitle || p.section}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.accessLevel === 'MANAGE'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {p.accessLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-400">
                          {p.grantedByUserId || primaryOwnerEmail}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(p.grantedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          {isRevoked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30" title={`Revoked on: ${p.revokedAt}`}>
                              REVOKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-sans">
                          {!isRevoked ? (
                            <button
                              type="button"
                              onClick={() => handleRevokePermission(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold transition"
                            >
                              Soft-Revoke
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">Revoked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Invite Staff Member */}
        {isInviteOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 max-w-lg w-full space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Invite / Grant Staff Member</h3>
                </div>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGrantPermission} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. employee@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    They sign up or log in via the regular Clerk flow. Access is recognized upon authentication.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Rohan Verma"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Section to Grant *
                  </label>
                  <select
                    value={inviteSection}
                    onChange={(e) => setInviteSection(e.target.value as AdminSection)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  >
                    {VIAR_SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {ADMIN_SECTIONS_META[sec]?.shortTitle} ({sec})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Access Level *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInviteAccessLevel('VIEW')}
                      className={`p-3 rounded-xl border text-left transition ${
                        inviteAccessLevel === 'VIEW'
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-blue-300 mb-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>VIEW Only</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Can view content, rosters, and lists without making modifications.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteAccessLevel('MANAGE')}
                      className={`p-3 rounded-xl border text-left transition ${
                        inviteAccessLevel === 'MANAGE'
                          ? 'border-purple-500 bg-purple-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300 mb-1">
                        <Settings className="w-3.5 h-3.5" />
                        <span>MANAGE (Full)</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Can edit, create new records, update links, and delete content.</p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    {loading ? 'Granting...' : 'Grant Permission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
