'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  HelpCircle,
  Search,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { MediaAssetItem, SEED_STATIC_ASSETS } from '@/lib/content/mediaTypes';

interface MediaLibraryProps {
  isOwner: boolean;
  userEmail: string;
}

export default function MediaLibrary({ isOwner, userEmail }: MediaLibraryProps) {
  void isOwner;
  void userEmail;
  const [assets, setAssets] = useState<MediaAssetItem[]>(() => SEED_STATIC_ASSETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Storage Status
  const [storageStatus, setStorageStatus] = useState<{ configured: boolean; message: string }>({
    configured: false,
    message: 'Cloudflare R2 public bucket for site images is not yet configured. Direct uploads are safely disabled.',
  });

  // Upload Form Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [altTextEn, setAltTextEn] = useState('');
  const [altTextHi, setAltTextHi] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Delete Confirmation Modal State
  const [assetToDelete, setAssetToDelete] = useState<MediaAssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssets = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/media?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
        if (data.storageStatus) {
          setStorageStatus(data.storageStatus);
        }
      } else {
        setErrorMessage(data.error || 'Failed to load media assets.');
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Selected file exceeds the maximum 5 MB limit. Please select a compressed JPG, PNG, or WebP.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, and WebP images are permitted.');
      return;
    }

    setUploadFile(file);
    if (!altTextEn) {
      setAltTextEn(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    if (!altTextEn.trim()) {
      alert('Alt text is required for every image to guarantee accessibility.');
      return;
    }

    if (!storageStatus.configured) {
      alert(storageStatus.message);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Request presigned upload URL or storage direct sink
      const presignRes = await fetch('/api/uploads/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadFile.name,
          contentType: uploadFile.type,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignData.success) {
        throw new Error(presignData.error || 'Failed to prepare upload destination.');
      }

      // 2. Direct upload from browser to object storage
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadFile.type },
        body: uploadFile,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with HTTP status ${uploadRes.status}`);
      }

      // 3. Register media asset in database
      const saveRes = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadFile.name,
          url: presignData.publicPreviewUrl || `/uploads/${presignData.fileKey}`,
          altTextEn: altTextEn.trim(),
          altTextHi: altTextHi.trim() || undefined,
          mimeType: uploadFile.type,
          sizeBytes: uploadFile.size,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveData.success) {
        throw new Error(saveData.error || 'Failed to register image in library.');
      }

      setSuccessMessage(`Image '${uploadFile.name}' uploaded and registered successfully!`);
      setIsUploadOpen(false);
      setUploadFile(null);
      setAltTextEn('');
      setAltTextHi('');
      fetchAssets();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(assetToDelete.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete asset.');
      }

      setSuccessMessage(data.message || 'Asset deleted successfully.');
      setAssetToDelete(null);
      fetchAssets();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* "How to" Help Panel for Acharya Niraj Kumar */}
      <div className="cosmic-card p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04]">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-300">
              💡 How to manage photos &amp; graphics:
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              • All site photos, instructor portraits, and award certificates are stored here.<br />
              • To use an image in any headline or page, click <strong>&quot;Copy Image Link&quot;</strong> and paste it into the Content Studio.<br />
              • <strong>Safety Protection:</strong> You cannot delete an image if it is currently being used on a live page. This prevents broken images on the website.
            </p>
          </div>
        </div>
      </div>

      {/* Storage Status Banner */}
      {!storageStatus.configured ? (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-bold block mb-1">Cloudflare R2 Object Storage Notice:</span>
            {storageStatus.message}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-emerald-200">
            {storageStatus.message}
          </span>
        </div>
      )}

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Actions & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by filename or alt text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchAssets}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
            title="Refresh assets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            disabled={!storageStatus.configured}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              storageStatus.configured
                ? 'gold-button shadow-md'
                : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
            }`}
            title={storageStatus.configured ? 'Upload new photo' : 'Configure Cloudflare R2 to enable uploads'}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image (Max 5 MB)</span>
          </button>
        </div>
      </div>

      {/* Media Assets Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading media library...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="cosmic-card p-12 text-center rounded-2xl border border-white/10">
          <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No media assets found</h3>
          <p className="text-xs text-slate-400">Try a different search query or upload a new photo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="cosmic-card rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-amber-500/40 transition"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full bg-slate-900/80 flex items-center justify-center overflow-hidden border-b border-white/10">
                <Image
                  src={asset.url}
                  alt={asset.altTextEn}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  unoptimized
                />
                {asset.inUse && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white backdrop-blur-md">
                    In Use
                  </span>
                )}
              </div>

              {/* Metadata Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white truncate" title={asset.filename}>
                    {asset.filename}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2" title={asset.altTextEn}>
                    Alt: {asset.altTextEn}
                  </p>
                  {asset.altTextHi && (
                    <p className="text-[10px] text-amber-300/80 mt-0.5 truncate" title={asset.altTextHi}>
                      हिन्दी: {asset.altTextHi}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                    <span>{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
                    <span>•</span>
                    <span className="uppercase">{asset.mimeType.split('/')[1]}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-3">
                  <button
                    onClick={() => handleCopyUrl(asset.url, asset.id)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setAssetToDelete(asset)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition"
                    title={asset.inUse ? 'In use on pages — cannot delete' : 'Delete asset'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="cosmic-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              <span>Upload New Media Asset</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Upload images directly to Cloudflare R2 storage. Alt text is mandatory for Google SEO and screen readers.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Image (JPG, PNG, WebP up to 5 MB) *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 file:cursor-pointer cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description / Alt Text (English) *
                </label>
                <input
                  type="text"
                  value={altTextEn}
                  onChange={(e) => setAltTextEn(e.target.value)}
                  placeholder="e.g. Acharya Niraj Kumar instructing Vedic Astrology students"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description / Alt Text (Hindi - Optional)
                </label>
                <input
                  type="text"
                  value={altTextHi}
                  onChange={(e) => setAltTextHi(e.target.value)}
                  placeholder="उदा. आचार्य नीरज कुमार वैदिक ज्योतिष कक्षा का संचालन करते हुए"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="gold-button px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload &amp; Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / In-Use Warning Modal */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="cosmic-card w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative">
            {assetToDelete.inUse ? (
              <div>
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white text-center mb-2">
                  Image is Currently in Use
                </h3>
                <p className="text-xs text-slate-300 text-center leading-relaxed mb-4">
                  <strong>&quot;{assetToDelete.filename}&quot;</strong> cannot be deleted because it is active on:
                </p>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 space-y-1 mb-6 max-h-32 overflow-y-auto">
                  {assetToDelete.locations && assetToDelete.locations.length > 0 ? (
                    assetToDelete.locations.map((loc, idx) => (
                      <div key={idx}>• {loc}</div>
                    ))
                  ) : (
                    <div>• Active site page</div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 text-center mb-6">
                  Please replace or remove this image from the page in Content Studio before deleting it.
                </p>
                <button
                  onClick={() => setAssetToDelete(null)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                >
                  Understood
                </button>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white text-center mb-2">
                  Confirm Permanent Deletion
                </h3>
                <p className="text-xs text-slate-300 text-center leading-relaxed mb-6">
                  Are you sure you want to permanently delete <strong>&quot;{assetToDelete.filename}&quot;</strong>? This file is not currently in use.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAssetToDelete(null)}
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
                      <span>Delete</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
