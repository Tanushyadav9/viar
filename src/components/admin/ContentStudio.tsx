'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Eye,
  RotateCcw,
  Trash2,
  Plus,
  HelpCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  X,
  Globe,
  Clock,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Mail,
} from 'lucide-react';
import type { FormattedContent } from '@/lib/content/contentTypes';
import { renderSafeContent } from '@/lib/content/sanitizer';
import { ContentStatus } from '@/lib/types';
import { BUILTIN_CONTENT_DEFAULTS } from '@/lib/content/defaultContent';

interface ContentStudioProps {
  isOwner: boolean;
  userEmail: string;
  initialCollection?: string;
  onActivityLogged?: () => void;
}

interface CollectionOption {
  id: string;
  label: string;
  description: string;
  ownerOnly?: boolean;
}

const COLLECTIONS: CollectionOption[] = [
  {
    id: 'site_settings',
    label: '1. Site Settings & Contact',
    description: 'WhatsApp number, phone, public contact email (not owner login), social links & announcement bar.',
  },
  {
    id: 'hero',
    label: '2. Homepage & Hero',
    description: 'Hero headline, sub-headline, buttons, section texts & featured courses.',
  },
  {
    id: 'about',
    label: '3. Institute & Instructor',
    description: 'Acharya Niraj Kumar About text, instructor photo, bio & approved credentials.',
  },
  {
    id: 'faqs',
    label: '4. FAQ & Student Questions',
    description: 'Answers read by website visitors and the live AI chatbot.',
  },
  {
    id: 'testimonials',
    label: '5. Student Testimonials',
    description: 'Student quotes, city, course, date, and mandatory explicit consent note.',
  },
  {
    id: 'popup',
    label: '6. Course Promotion Popup',
    description: 'Course promo modal (headline, text, image, dates, enabled).',
  },
  {
    id: 'certificate_template',
    label: '7. Certificate Template Text',
    description: 'Institute accreditation name & verification signatory line.',
  },
  {
    id: 'legal',
    label: '8. Legal Pages (Owner Only)',
    description: 'Terms of service, refund policy, and pending lawyer review flag.',
    ownerOnly: true,
  },
  {
    id: 'announcements',
    label: '9. Blog & Announcements',
    description: 'Academy notice board, admissions announcements & updates.',
  },
];

export default function ContentStudio({
  isOwner,
  userEmail,
  initialCollection = 'site_settings',
  onActivityLogged,
}: ContentStudioProps) {
  void userEmail;
  const [activeCollection, setActiveCollection] = useState<string>(initialCollection);
  const [items, setItems] = useState<FormattedContent[]>(() => {
    const defs = BUILTIN_CONTENT_DEFAULTS[initialCollection] || [];
    return defs.map((d) => ({
      id: `builtin-${d.collection}-${d.key}`,
      collection: d.collection,
      key: d.key,
      titleEn: d.titleEn,
      titleHi: d.titleHi,
      contentEn: d.contentEn,
      contentHi: d.contentHi,
      metadata: (d.metadata || {}) as Record<string, unknown>,
      status: 'PUBLISHED' as ContentStatus,
      sortOrder: d.sortOrder,
      isCustomized: false,
    }));
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active Item Editor State
  const [editingItem, setEditingItem] = useState<FormattedContent | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'hi'>('en');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formTitleHi, setFormTitleHi] = useState('');
  const [formContentEn, setFormContentEn] = useState('');
  const [formContentHi, setFormContentHi] = useState('');
  const [formStatus, setFormStatus] = useState<ContentStatus>('PUBLISHED');
  const [formMetadata, setFormMetadata] = useState<Record<string, unknown>>({});
  const [formChangeSummary, setFormChangeSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Revision History Modal
  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Delete Confirmation Modal
  const [itemToDelete, setItemToDelete] = useState<FormattedContent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const handleSendTestEmail = async () => {
    const emailToTest = (formContentEn || formContentHi || '').trim();
    if (!emailToTest || !emailToTest.includes('@')) {
      alert('Please enter a valid email address first.');
      return;
    }
    setIsSendingTestEmail(true);
    try {
      const res = await fetch('/api/admin/content/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToTest }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Test email dispatched! Please check your mailbox.');
      } else {
        alert(`Failed to send test email: ${data.error}`);
      }
    } catch (err) {
      alert(`Network error sending test email: ${(err as Error).message}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const fetchCollectionItems = async (collection: string) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/content?collection=${encodeURIComponent(collection)}`);
      const data = await res.json();
      if (data.success && data.items && data.items.length > 0) {
        setItems(data.items);
      }
    } catch {
      // Retain existing default items on network latency
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const defs = BUILTIN_CONTENT_DEFAULTS[activeCollection] || [];
    setItems(defs.map((d) => ({
      id: `builtin-${d.collection}-${d.key}`,
      collection: d.collection,
      key: d.key,
      titleEn: d.titleEn,
      titleHi: d.titleHi,
      contentEn: d.contentEn,
      contentHi: d.contentHi,
      metadata: (d.metadata || {}) as Record<string, unknown>,
      status: 'PUBLISHED' as ContentStatus,
      sortOrder: d.sortOrder,
      isCustomized: false,
    })));
    fetchCollectionItems(activeCollection);
    setEditingItem(null);
  }, [activeCollection]);

  // Open item editor
  const handleEditItem = (item: FormattedContent) => {
    setEditingItem(item);
    setFormTitleEn(item.titleEn || '');
    setFormTitleHi(item.titleHi || '');
    setFormContentEn(item.contentEn || '');
    setFormContentHi(item.contentHi || '');
    setFormStatus(item.status || 'PUBLISHED');
    setFormMetadata({ ...(item.metadata || {}) });
    setFormChangeSummary('');
    setActiveLangTab('en');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Quick New Item (e.g. for FAQs, Testimonials, Announcements)
  const handleCreateNewItem = () => {
    const initialMeta: Record<string, unknown> = {};
    if (activeCollection === 'testimonials') {
      initialMeta.rating = 5;
      initialMeta.consentGiven = false;
      initialMeta.consentNote = '';
    } else if (activeCollection === 'popup') {
      initialMeta.enabled = true;
      initialMeta.startDate = new Date().toISOString().split('T')[0];
      initialMeta.endDate = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    } else if (activeCollection === 'legal') {
      initialMeta.pendingLawyerReview = false;
    }

    const newItem: FormattedContent = {
      collection: activeCollection,
      key: `${activeCollection}_${Date.now()}`,
      titleEn: '',
      titleHi: '',
      contentEn: '',
      contentHi: '',
      metadata: initialMeta,
      status: 'PUBLISHED',
      sortOrder: items.length + 1,
      isCustomized: true,
    };
    handleEditItem(newItem);
  };

  // Reorder items
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setItems(newItems);

    try {
      // Save updated order
      for (let i = 0; i < newItems.length; i++) {
        await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection: activeCollection,
            key: newItems[i].key,
            titleEn: newItems[i].titleEn,
            titleHi: newItems[i].titleHi,
            contentEn: newItems[i].contentEn,
            contentHi: newItems[i].contentHi,
            status: newItems[i].status,
            sortOrder: i + 1,
            changeSummary: 'Reordered list in Content Studio',
          }),
        });
      }
      setSuccessMessage('Order saved. Public pages updated.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  // Toggle Hide / Publish directly from the list
  const handleToggleHide = async (item: FormattedContent) => {
    const newStatus: ContentStatus = item.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN';
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: item.collection,
          key: item.key,
          id: item.id,
          action: 'status',
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Item is now ${newStatus}.`);
        fetchCollectionItems(activeCollection);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  // Save changes
  const handleSave = async (targetStatus?: ContentStatus) => {
    if (!editingItem) return;

    if (!formTitleEn.trim() && !formContentEn.trim()) {
      alert('Please provide at least an English title or content.');
      return;
    }

    const statusToSave = targetStatus || formStatus;

    // Validation: Testimonials require explicit consent note before publishing
    if (editingItem.collection === 'testimonials' && statusToSave === 'PUBLISHED') {
      const consentGiven = Boolean(formMetadata.consentGiven);
      const consentNote = String(formMetadata.consentNote || '').trim();
      if (!consentGiven || !consentNote) {
        alert('A required consent note is mandatory to publish student testimonials (e.g. "Written consent received via email on [Date]"). Please provide the consent note and confirm student consent.');
        return;
      }
    }

    // Validation: Contact email format & owner privacy rule
    if (editingItem.collection === 'site_settings' && editingItem.key === 'contact_email') {
      const emailVal = (formContentEn || formContentHi || '').trim().toLowerCase();
      if (emailVal && emailVal === 'aapkaastro1606@gmail.com') {
        alert('Security Rule: The public contact email must NOT be the Owner login address (aapkaastro1606@gmail.com). Please supply a separate public email address (e.g. contact@viar.in) or leave it empty/hidden until confirmed.');
        return;
      }
      if (emailVal && !emailVal.includes('@')) {
        alert('Please enter a valid contact email address.');
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: editingItem.collection,
          key: editingItem.key,
          titleEn: formTitleEn.trim(),
          titleHi: formTitleHi.trim(),
          contentEn: formContentEn,
          contentHi: formContentHi,
          metadata: formMetadata,
          status: statusToSave,
          sortOrder: editingItem.sortOrder,
          changeSummary:
            formChangeSummary.trim() ||
            (statusToSave === 'PUBLISHED' ? 'Published live via Content Studio' : 'Saved draft'),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save content.');
      }

      setSuccessMessage(data.message || 'Saved successfully!');
      setEditingItem(null);
      fetchCollectionItems(activeCollection);
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Open Revisions Modal
  const handleOpenRevisions = async (item: FormattedContent) => {
    if (!item.id) {
      alert('This item has not yet been customized in the database (using built-in default).');
      return;
    }
    setIsRevisionsOpen(true);
    setIsLoadingRevisions(true);
    try {
      const res = await fetch(`/api/admin/content/revisions?contentId=${encodeURIComponent(item.id)}`);
      const data = await res.json();
      if (data.success) {
        setRevisions(data.revisions || []);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoadingRevisions(false);
    }
  };

  // Restore 1-click revision
  const handleRestoreRevision = async (revisionId: string) => {
    if (!confirm('Restore content to this historical snapshot? The site will be updated immediately.')) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await fetch('/api/admin/content/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to restore revision.');
      }

      setSuccessMessage('Revision restored successfully!');
      setIsRevisionsOpen(false);
      fetchCollectionItems(activeCollection);
      if (editingItem) setEditingItem(null);
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Permanent Delete
  const handleDelete = async () => {
    if (!itemToDelete) return;
    if (!itemToDelete.id) {
      alert('Built-in default content cannot be deleted. You can hide it instead.');
      setItemToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/content?id=${encodeURIComponent(itemToDelete.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete content.');
      }

      setSuccessMessage(data.message || 'Item permanently deleted.');
      setItemToDelete(null);
      fetchCollectionItems(activeCollection);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if Hindi is missing
  const isHindiMissing = Boolean(
    editingItem &&
    (formTitleEn.trim() && !formTitleHi.trim()) ||
    (formContentEn.trim() && !formContentHi.trim())
  );

  return (
    <div className="space-y-8">
      
      {/* "How to" Help Panel for Acharya Niraj Kumar */}
      <div className="cosmic-card p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04]">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-300">
              💡 How to manage website text &amp; content:
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              • <strong>Edit Text:</strong> Click on any question or headline below, change the words, and click <strong>&quot;Publish to Website&quot;</strong>.<br />
              • <strong>Hindi Support:</strong> When visitors click the Hindi toggle, they see the Hindi translation. If Hindi is blank, English is safely shown automatically.<br />
              • <strong>Hide vs Delete:</strong> Use <strong>&quot;Hide&quot;</strong> to take an item offline without losing its text or history. You can restore it anytime with 1 click.<br />
              • <strong>Zero Waiting:</strong> Changes appear on the live website within 60 seconds with no redeployment needed.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Collection Navigation Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-2 pb-2">
        {COLLECTIONS.map((col) => {
          if (col.ownerOnly && !isOwner) return null;
          const isActive = activeCollection === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <span>{col.label}</span>
              {col.ownerOnly && (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                  Owner
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content View / Editor Split */}
      {!editingItem ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                {COLLECTIONS.find((c) => c.id === activeCollection)?.label}
              </h3>
              <p className="text-xs text-slate-400">
                {COLLECTIONS.find((c) => c.id === activeCollection)?.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchCollectionItems(activeCollection)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                title="Refresh items"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {['faqs', 'testimonials', 'announcements'].includes(activeCollection) && (
                <button
                  onClick={handleCreateNewItem}
                  className="gold-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Item</span>
                </button>
              )}
            </div>
          </div>

          {/* Non-technical How To Panel */}
          <div className="cosmic-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                <strong className="text-amber-300">💡 How to manage content:</strong> Click &quot;Edit&quot; on any item below to update its English and Hindi text. You can save as Draft or Publish live with one click. Use &quot;Hide&quot; to temporarily remove an item without permanently deleting it.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading collection items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="cosmic-card p-12 text-center rounded-2xl border border-white/10">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">No items found</h4>
              <p className="text-xs text-slate-400">Add an item or seed the database defaults.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const isHidden = item.status === 'HIDDEN';
                const isDraft = item.status === 'DRAFT';
                const itemMeta = (item.metadata || {}) as Record<string, unknown>;
                const isPendingLawyer = Boolean(itemMeta.pendingLawyerReview);
                const isTestimonialConsent = item.collection === 'testimonials' && Boolean(itemMeta.consentGiven);
                const isPopupEnabled = item.collection === 'popup' && itemMeta.enabled !== false;
                const isAnnouncementActive = item.key === 'announcement_bar' && itemMeta.active !== false;

                return (
                  <div
                    key={item.key || index}
                    className={`cosmic-card p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isHidden
                        ? 'border-white/5 bg-white/[0.01] opacity-60'
                        : isDraft
                        ? 'border-amber-500/30 bg-amber-500/[0.02]'
                        : 'border-white/10 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                            isHidden
                              ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              : isDraft
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.status}
                        </span>

                        {isPendingLawyer && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⚠️ Pending Lawyer Review
                          </span>
                        )}

                        {(Boolean(itemMeta.needsConfirmation) || item.key === 'announcement_bar' || item.key === 'contact_email' || isDraft) && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Needs confirmation
                          </span>
                        )}

                        {item.collection === 'testimonials' && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isTestimonialConsent
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-300 border border-red-500/20'
                            }`}
                          >
                            {isTestimonialConsent ? '✓ Consent Verified' : '✕ Consent Needed'}
                          </span>
                        )}

                        {item.collection === 'popup' && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isPopupEnabled
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {isPopupEnabled ? 'Popup Active' : 'Popup Paused'}
                          </span>
                        )}

                        {item.key === 'announcement_bar' && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isAnnouncementActive
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {isAnnouncementActive ? 'Bar Active' : 'Bar Paused'}
                          </span>
                        )}

                        {!item.titleHi && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Hindi Missing
                          </span>
                        )}

                        <span className="text-xs font-mono text-slate-500 truncate">
                          {item.key}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">
                        {item.titleEn || item.key}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.contentEn || 'No details entered.'}
                      </p>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Move Up / Down controls */}
                      {items.length > 1 && (
                        <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
                          <button
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === items.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Quick Hide Toggle */}
                      <button
                        onClick={() => handleToggleHide(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isHidden
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {isHidden ? 'Unhide' : 'Hide'}
                      </button>

                      {/* Revisions History */}
                      <button
                        onClick={() => handleOpenRevisions(item)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                        title="View revision snapshot history"
                      >
                        <Clock className="w-4 h-4 text-amber-400" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditItem(item)}
                        className="gold-button px-4 py-1.5 rounded-xl text-xs font-bold shadow-md"
                      >
                        Edit
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ITEM EDITING FORM */
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-[#0c101a] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-mono tracking-wider text-amber-400">
                  {editingItem.collection} / {editingItem.key}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300">
                  Status: {formStatus}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                Edit Content Item
              </h3>
            </div>

            <button
              onClick={() => setEditingItem(null)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 self-start sm:self-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Non-technical How To Edit Panel */}
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">
                <strong className="text-amber-300">💡 How to edit:</strong> Update text in the English and Hindi tabs. Formatting is limited to safe headings, bold, lists, and verified links. Use &quot;Save as Draft&quot; to review, or &quot;Publish to Website&quot; to push live immediately without redeploying.
              </p>
            </div>
          </div>

          {/* Hindi Missing Warning Indicator */}
          {isHindiMissing && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Hindi Translation Missing:</strong> The Hindi field is currently empty.
                  Visitors on the Hindi version of the site will automatically see English text as a safe fallback.
                </span>
              </div>
              <button
                onClick={() => setActiveLangTab('hi')}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold shrink-0"
              >
                Add Hindi Now &rarr;
              </button>
            </div>
          )}

          {/* Language Tabs (English vs Hindi) */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveLangTab('en')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeLangTab === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>English (Primary)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLangTab('hi')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeLangTab === 'hi'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>हिन्दी (Hindi)</span>
                {!formTitleHi && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showLivePreview ? 'Hide Preview' : 'Show Live Preview'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Input Fields */}
            <div className={showLivePreview ? 'lg:col-span-7 space-y-5' : 'lg:col-span-12 space-y-5'}>
              
              {/* Title / Headline Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    {activeLangTab === 'en' ? 'Headline / Question (English)' : 'शीर्षक / प्रश्न (हिन्दी)'} *
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {(activeLangTab === 'en' ? formTitleEn : formTitleHi).length} / 200 chars
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  value={activeLangTab === 'en' ? formTitleEn : formTitleHi}
                  onChange={(e) => {
                    if (activeLangTab === 'en') setFormTitleEn(e.target.value);
                    else setFormTitleHi(e.target.value);
                  }}
                  placeholder={
                    activeLangTab === 'en'
                      ? 'e.g. Master Authentic Vedic Astrology with Live Classes'
                      : 'उदा. गुरु-शिष्य परंपरा से सीखें प्रामाणिक वैदिक ज्योतिष'
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Rich Text Toolbar Helpers */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    {activeLangTab === 'en' ? 'Detailed Content / Answer (English)' : 'विस्तृत विवरण / उत्तर (हिन्दी)'} *
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {(activeLangTab === 'en' ? formContentEn : formContentHi).length} / 5000 chars
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-2 p-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <span className="text-[11px] text-slate-400 px-2 font-semibold">Safe Formatting:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = activeLangTab === 'en' ? formContentEn : formContentHi;
                      const next = cur + ' **bold text** ';
                      if (activeLangTab === 'en') setFormContentEn(next);
                      else setFormContentHi(next);
                    }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = activeLangTab === 'en' ? formContentEn : formContentHi;
                      const next = cur + ' *italic text* ';
                      if (activeLangTab === 'en') setFormContentEn(next);
                      else setFormContentHi(next);
                    }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 italic"
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = activeLangTab === 'en' ? formContentEn : formContentHi;
                      const next = cur + '\n• List point 1\n• List point 2\n';
                      if (activeLangTab === 'en') setFormContentEn(next);
                      else setFormContentHi(next);
                    }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    • Bullet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = activeLangTab === 'en' ? formContentEn : formContentHi;
                      const next = cur + ' [WhatsApp Support](https://wa.me/919311215564) ';
                      if (activeLangTab === 'en') setFormContentEn(next);
                      else setFormContentHi(next);
                    }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    + Link
                  </button>
                </div>

                <textarea
                  rows={8}
                  maxLength={5000}
                  value={activeLangTab === 'en' ? formContentEn : formContentHi}
                  onChange={(e) => {
                    if (activeLangTab === 'en') setFormContentEn(e.target.value);
                    else setFormContentHi(e.target.value);
                  }}
                  placeholder={
                    activeLangTab === 'en'
                      ? 'Type full answer, explanation, or paragraph text here...'
                      : 'यहाँ सम्पूर्ण उत्तर या विवरण लिखें...'
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-sans leading-relaxed"
                />
              </div>

              {/* Status & Change Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="PUBLISHED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Published (Visible to all visitors)</option>
                    <option value="DRAFT" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Draft (Hidden from public)</option>
                    <option value="HIDDEN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Hidden (Archived offline)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Note for Audit Log (Optional)
                  </label>
                  <input
                    type="text"
                    value={formChangeSummary}
                    onChange={(e) => setFormChangeSummary(e.target.value)}
                    placeholder="e.g. Updated WhatsApp hours for 2026"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Collection-Specific Metadata Editors */}
              {editingItem.collection === 'testimonials' && (
                <div className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Student Details &amp; Mandatory Consent
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Student Name or Initials *</label>
                      <input
                        type="text"
                        value={String(formMetadata.name || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, name: e.target.value })}
                        placeholder="e.g. Rajesh M. or Priya S."
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City / Region *</label>
                      <input
                        type="text"
                        value={String(formMetadata.city || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, city: e.target.value })}
                        placeholder="e.g. Mumbai, India or London, UK"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Course Completed *</label>
                      <input
                        type="text"
                        value={String(formMetadata.course || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, course: e.target.value })}
                        placeholder="e.g. The Ultimate Astrology Course"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Review Date *</label>
                      <input
                        type="text"
                        value={String(formMetadata.date || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, date: e.target.value })}
                        placeholder="e.g. 2026-03"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Required Consent Note (Mandatory for publishing) */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <label className="block text-xs font-bold text-amber-300">
                      Required Consent Note (Mandatory before publishing) *
                    </label>
                    <input
                      type="text"
                      value={String(formMetadata.consentNote || '')}
                      onChange={(e) => setFormMetadata({ ...formMetadata, consentNote: e.target.value })}
                      placeholder='e.g. "Written consent received via email on 2026-03-10 from student"'
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(formMetadata.consentGiven)}
                        onChange={(e) => setFormMetadata({ ...formMetadata, consentGiven: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-white/10 border-white/20"
                      />
                      <span>Student provided explicit written consent to publish this feedback on VIAR.in</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Popup Promo Modal Controls */}
              {editingItem.collection === 'popup' && (
                <div className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-amber-300 uppercase tracking-wider">
                        Course Promotion Popup Controls
                      </h4>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                      <input
                        type="checkbox"
                        checked={formMetadata.enabled !== false}
                        onChange={(e) => setFormMetadata({ ...formMetadata, enabled: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-white/10 border-white/20"
                      />
                      <span>{formMetadata.enabled !== false ? 'Popup Enabled (Active)' : 'Popup Paused'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                      <input
                        type="date"
                        value={String(formMetadata.startDate || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                      <input
                        type="date"
                        value={String(formMetadata.endDate || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Badge / Announcement Text</label>
                      <input
                        type="text"
                        value={String(formMetadata.dates || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, dates: e.target.value })}
                        placeholder="Launch Enrollment Open"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Destination URL (CTA Link)</label>
                      <input
                        type="text"
                        value={String(formMetadata.linkUrl || formMetadata.url || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, linkUrl: e.target.value, url: e.target.value })}
                        placeholder="/checkout"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">Image URL</label>
                      <input
                        type="text"
                        value={String(formMetadata.imageUrl || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, imageUrl: e.target.value })}
                        placeholder="/images/Acharya_Niraj_Kumar_Solo.jpg"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Button Label (English)</label>
                      <input
                        type="text"
                        value={String(formMetadata.buttonLabelEn || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, buttonLabelEn: e.target.value })}
                        placeholder="Enroll Now — Instant Access"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Button Label (Hindi)</label>
                      <input
                        type="text"
                        value={String(formMetadata.buttonLabelHi || '')}
                        onChange={(e) => setFormMetadata({ ...formMetadata, buttonLabelHi: e.target.value })}
                        placeholder="अभी प्रवेश लें — तुरंत एक्सेस"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Legal Pages Controls (Owner Only + Pending Lawyer Review) */}
              {editingItem.collection === 'legal' && (
                <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Legal Compliance Flag (Owner Only)</span>
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-200">
                      <input
                        type="checkbox"
                        checked={Boolean(formMetadata.pendingLawyerReview)}
                        onChange={(e) => setFormMetadata({ ...formMetadata, pendingLawyerReview: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-white/10 border-white/20"
                      />
                      <span>Flag: Pending Lawyer Review</span>
                    </label>
                  </div>
                  {Boolean(formMetadata.pendingLawyerReview) && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                      ⚠️ <strong>Notice:</strong> This legal document is marked as <em>Pending Lawyer Review</em>. Visitors and administrators will see this flag until counsel sign-off is complete.
                    </div>
                  )}
                </div>
              )}

              {/* Site Settings & Announcement Bar Controls */}
              {editingItem.collection === 'site_settings' && editingItem.key === 'announcement_bar' && (
                <div className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-bold text-amber-300">Sitewide Announcement Bar</span>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                      <input
                        type="checkbox"
                        checked={formMetadata.active !== false}
                        onChange={(e) => setFormMetadata({ ...formMetadata, active: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-white/10 border-white/20"
                      />
                      <span>{formMetadata.active !== false ? 'Bar Active (Visible)' : 'Bar Disabled (Hidden)'}</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Link URL</label>
                    <input
                      type="text"
                      value={String(formMetadata.url || '')}
                      onChange={(e) => setFormMetadata({ ...formMetadata, url: e.target.value })}
                      placeholder="/courses/what-is-astrology"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Public Contact Email Advisory & Test Email Button */}
              {editingItem.collection === 'site_settings' && editingItem.key === 'contact_email' && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-3">
                  <div className="text-blue-200 leading-relaxed">
                    💡 <strong>Public Inquiry Email:</strong> This address is shown to visitors on the website contact page and footer for student inquiries.
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-blue-500/20">
                    <span className="text-[11px] text-slate-400">
                      Verify this mailbox can receive incoming student messages:
                    </span>
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={isSendingTestEmail}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{isSendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* About Instructor Photo */}
              {editingItem.collection === 'about' && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 text-xs">
                  <label className="block text-slate-300 font-semibold">Instructor Photo URL</label>
                  <input
                    type="text"
                    value={String(formMetadata.photoUrl || '')}
                    onChange={(e) => setFormMetadata({ ...formMetadata, photoUrl: e.target.value })}
                    placeholder="/images/Acharya_Niraj_Kumar_Solo.jpg"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Certificate Template Controls */}
              {editingItem.collection === 'certificate_template' && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 text-xs">
                  <label className="block text-slate-300 font-semibold">Signatory Title &amp; Partner Line</label>
                  <input
                    type="text"
                    value={String(formMetadata.partnerLine || '')}
                    onChange={(e) => setFormMetadata({ ...formMetadata, partnerLine: e.target.value })}
                    placeholder="In academic partnership with Aapka Astro (aapkaastro.com)"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Announcements Target Link & Active Toggle */}
              {editingItem.collection === 'announcements' && (
                <div className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-bold text-amber-300">Announcement Status</span>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                      <input
                        type="checkbox"
                        checked={formMetadata.active !== false}
                        onChange={(e) => setFormMetadata({ ...formMetadata, active: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-white/10 border-white/20"
                      />
                      <span>{formMetadata.active !== false ? 'Active on Notice Board' : 'Hidden from Notice Board'}</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Link URL</label>
                    <input
                      type="text"
                      value={String(formMetadata.url || '')}
                      onChange={(e) => setFormMetadata({ ...formMetadata, url: e.target.value })}
                      placeholder="/courses/what-is-astrology"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Preview Pane */}
            {showLivePreview && (
              <div className="lg:col-span-5 bg-black/40 rounded-2xl border border-white/10 p-5 space-y-3 sticky top-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Live Visitor Preview ({activeLangTab.toUpperCase()})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">Instant Render</span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-white">
                    {(activeLangTab === 'hi' ? formTitleHi : formTitleEn) || (
                      <span className="text-slate-600 italic">No title entered</span>
                    )}
                  </h4>

                  <div
                    className="text-xs text-slate-300 leading-relaxed space-y-2 border-t border-white/5 pt-3"
                    dangerouslySetInnerHTML={{
                      __html: renderSafeContent(
                        (activeLangTab === 'hi' ? formContentHi : formContentEn) ||
                          'Preview of the formatted description will appear here.'
                      ),
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Action Controls */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white"
            >
              &larr; Cancel &amp; Back to list
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave('DRAFT')}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition"
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSave('PUBLISHED')}
                disabled={isSaving}
                className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Publish to Website</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision History Modal with 1-Click Restore */}
      {isRevisionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="cosmic-card w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  Revision Snapshot History
                </h3>
              </div>
              <button
                onClick={() => setIsRevisionsOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              Every save creates an immutable snapshot. You can preview past versions and restore any of them with one click.
            </p>

            {isLoadingRevisions ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading historical snapshots...</p>
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No past revisions found for this item.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                        {rev.createdById && (
                          <span className="text-[10px] text-slate-500">
                            by {rev.createdById}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-300/80">
                        {rev.changeSummary || 'Saved changes'}
                      </p>
                      {rev.snapshot?.titleEn && (
                        <p className="text-[11px] text-slate-400 mt-1 truncate max-w-md">
                          Title: {rev.snapshot.titleEn}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleRestoreRevision(rev.id)}
                      disabled={isRestoring}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This Version</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="cosmic-card w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Confirm Permanent Deletion
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete <strong>&quot;{itemToDelete.titleEn || itemToDelete.key}&quot;</strong>?
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 text-left mb-6">
              💡 <strong>Recommendation:</strong> Use <strong>&quot;Hide&quot;</strong> instead so the item is removed from public view but can be restored at any time.
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
