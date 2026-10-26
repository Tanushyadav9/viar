'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw, FileText } from 'lucide-react';

interface TestDataDryRun {
  testOrdersCount: number;
  testUsersCount: number;
  testEnrollmentsCount: number;
  testOrders: Array<{
    id: string;
    orderReference: string;
    studentName?: string | null;
    studentEmail?: string | null;
    amount: number;
    status: string;
    notes?: string | null;
    createdAt: string;
  }>;
  testUsers: Array<{
    id: string;
    name: string;
    email?: string | null;
    role: string;
    createdAt: string;
  }>;
  testEnrollments: Array<{
    id: string;
    amountPaid: number;
    status: string;
    user?: { name: string; email?: string | null } | null;
  }>;
}

interface TestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TestDataModal({ isOpen, onClose, onSuccess }: TestDataModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TestDataDryRun | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDryRun = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/test-data');
      const json = await res.json();
      if (json.success && json.dryRun) {
        setData(json.dryRun);
      } else {
        throw new Error(json.error || 'Failed to load test data dry-run list.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error fetching test data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDryRun();
      setConfirmInput('');
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canDelete = confirmInput.trim() === 'DELETE_TEST_DATA';

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;
    setIsDeleting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/test-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE_TEST_DATA' }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        await fetchDryRun();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(json.error || 'Failed to delete test data.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error deleting test data.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl cosmic-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#0a0e1a] text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Manage &amp; Remove Test Data</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit dry-run list of staging orders, test students, and verification runs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Scanning database for test records...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Test Orders</span>
                  <p className="text-xl font-black text-amber-300 mt-0.5">
                    {data?.testOrdersCount || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Test Students</span>
                  <p className="text-xl font-black text-amber-300 mt-0.5">
                    {data?.testUsersCount || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Test Enrollments</span>
                  <p className="text-xl font-black text-amber-300 mt-0.5">
                    {data?.testEnrollmentsCount || 0}
                  </p>
                </div>
              </div>

              {/* Dry-Run List */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Dry-Run Inventory: Identified Test Records</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Excluded from all live revenue &amp; active student totals
                  </span>
                </div>

                {data && data.testOrders.length === 0 && data.testUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center italic">
                    Zero test records found. The database contains only clean live student records.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {data?.testOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white text-[11px] font-bold">
                              {ord.orderReference}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Test Order
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ord.studentName || 'Student'} • {ord.studentEmail} • ₹{ord.amount}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deletion Confirmation Guard */}
              {data && (data.testOrders.length > 0 || data.testEnrollments.length > 0) && (
                <div className="p-4 rounded-xl bg-rose-500/[0.08] border border-rose-500/30 space-y-3">
                  <div className="text-xs text-rose-200 leading-relaxed">
                    <strong className="text-rose-100 font-bold block mb-1">
                      Permanent Removal of Test Records:
                    </strong>
                    Removing test data will clean the identified test orders and mock enrollments without touching live student accounts or course configurations.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Type <strong className="text-rose-300 font-mono">DELETE_TEST_DATA</strong> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      placeholder="DELETE_TEST_DATA"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-rose-500/40 text-white font-mono text-xs focus:outline-none focus:border-rose-400 placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
          >
            Close
          </button>

          {data && (data.testOrders.length > 0 || data.testEnrollments.length > 0) && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                canDelete && !isDeleting
                  ? 'bg-rose-600 hover:bg-rose-500 text-white font-extrabold cursor-pointer shadow-lg shadow-rose-600/30'
                  : 'bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed opacity-60'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting Test Records...' : 'Permanently Remove Test Data'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
