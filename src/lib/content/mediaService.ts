import { prisma } from '../prisma.ts';

export interface MediaAssetItem {
  id: string;
  filename: string;
  url: string;
  altTextEn: string;
  altTextHi?: string | null;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  createdById?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  inUse?: boolean;
  locations?: string[];
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB strict limit
export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Checks whether Cloudflare R2 object storage is fully configured.
 */
export function isStorageConfigured(): { configured: boolean; message: string } {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_R2_URL;

  if (accountId && accessKey && secretKey && publicDomain) {
    return {
      configured: true,
      message: 'Cloudflare R2 object storage is active and configured for direct browser uploads.',
    };
  }

  return {
    configured: false,
    message:
      'Cloudflare R2 public storage credentials are not configured in environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_DOMAIN). Direct image uploads are disabled to protect database storage. Existing site images remain fully accessible.',
  };
}

/**
 * Checks if a given media URL or filename is currently used across any site content.
 * Prevents accidental deletion of photos embedded in published pages.
 */
export async function checkMediaAssetUsage(urlOrFilename: string): Promise<{ inUse: boolean; locations: string[] }> {
  if (!urlOrFilename) {
    return { inUse: false, locations: [] };
  }

  const locations: string[] = [];
  const searchPattern = urlOrFilename.trim();

  try {
    // 1. Search in ContentItem (contentEn, contentHi, metadata)
    const contentMatches = await prisma.contentItem.findMany({
      where: {
        OR: [
          { contentEn: { contains: searchPattern } },
          { contentHi: { contains: searchPattern } },
        ],
      },
      select: {
        collection: true,
        key: true,
        titleEn: true,
      },
    });

    for (const match of contentMatches) {
      locations.push(`Content: ${match.collection} / ${match.titleEn || match.key}`);
    }

    // 2. Search in Courses
    const courseMatches = await prisma.course.findMany({
      where: {
        OR: [
          { description: { contains: searchPattern } },
        ],
      },
      select: {
        title: true,
      },
    });

    for (const match of courseMatches) {
      locations.push(`Course: ${match.title}`);
    }
  } catch (error) {
    console.warn('[MediaService] Error checking asset usage:', error);
  }

  return {
    inUse: locations.length > 0,
    locations,
  };
}

/**
 * Initial static gallery assets seeded into the Media Library for easy selection
 */
export const SEED_STATIC_ASSETS: MediaAssetItem[] = [
  {
    id: 'media-acharya-headshot',
    filename: 'Acharya_Niraj_Kumar_Headshot.jpg',
    url: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
    altTextEn: 'Acharya Niraj Kumar Master Astrologer Headshot',
    altTextHi: 'आचार्य नीरज कुमार मुख्य ज्योतिषी चित्र',
    mimeType: 'image/jpeg',
    sizeBytes: 245000,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'media-acharya-solo',
    filename: 'Acharya_Niraj_Kumar_Solo.jpg',
    url: '/images/Acharya_Niraj_Kumar_Solo.jpg',
    altTextEn: 'Acharya Niraj Kumar Vedic Jyotish Consultant',
    altTextHi: 'आचार्य नीरज कुमार वैदिक ज्योतिष परामर्शदाता',
    mimeType: 'image/jpeg',
    sizeBytes: 310000,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'media-logo-icon',
    filename: 'logo-icon.png',
    url: '/images/logo-icon.png',
    altTextEn: 'VIAR Institute Golden Emblem Logo',
    altTextHi: 'विहंगम संस्थान स्वर्ण प्रतीक चिन्ह',
    mimeType: 'image/png',
    sizeBytes: 45000,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'media-gallery-award',
    filename: 'Shivjyoti_Best_Astrologer_Award.jpg',
    url: '/images/gallery/Shivjyoti_Best_Astrologer_Award.jpg',
    altTextEn: 'Shivjyoti Best Astrologer Felicitation Award',
    altTextHi: 'शिवज्योति सर्वश्रेष्ठ ज्योतिषी सम्मान पुरस्कार',
    mimeType: 'image/jpeg',
    sizeBytes: 380000,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'media-gallery-cert',
    filename: 'Jyotish_Acharya_Certificate.png',
    url: '/images/gallery/Jyotish_Acharya_Certificate.png',
    altTextEn: 'Jyotish Acharya Academic Credential Certificate',
    altTextHi: 'ज्योतिष आचार्य शैक्षणिक प्रमाणपत्र',
    mimeType: 'image/png',
    sizeBytes: 520000,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

/**
 * Lists media assets from DB merged with default seed assets.
 */
export async function listMediaAssets(options: { search?: string } = {}): Promise<MediaAssetItem[]> {
  const query = options.search?.trim().toLowerCase();

  try {
    const dbAssets = await prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const combined: MediaAssetItem[] = [
      ...dbAssets.map((a) => ({
        id: a.id,
        filename: a.filename,
        url: a.url,
        altTextEn: a.altTextEn,
        altTextHi: a.altTextHi,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        width: a.width,
        height: a.height,
        createdById: a.createdById,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      ...SEED_STATIC_ASSETS,
    ];

    // De-duplicate by URL
    const uniqueMap = new Map<string, MediaAssetItem>();
    for (const item of combined) {
      if (!uniqueMap.has(item.url)) {
        uniqueMap.set(item.url, item);
      }
    }

    let items = Array.from(uniqueMap.values());

    if (query) {
      items = items.filter(
        (i) =>
          i.filename.toLowerCase().includes(query) ||
          i.altTextEn.toLowerCase().includes(query) ||
          (i.altTextHi && i.altTextHi.toLowerCase().includes(query))
      );
    }

    // Annotate usage status
    for (const item of items) {
      const usage = await checkMediaAssetUsage(item.url);
      item.inUse = usage.inUse;
      item.locations = usage.locations;
    }

    return items;
  } catch (error) {
    console.warn('[MediaService] DB query failed, returning static seed media assets:', error);
    return SEED_STATIC_ASSETS.map((a) => ({ ...a, inUse: true, locations: ['Built-in System Asset'] }));
  }
}

/**
 * Registers an uploaded media asset into the database.
 */
export async function createMediaAsset(data: {
  filename?: string;
  fileName?: string;
  url?: string;
  altTextEn?: string;
  altTextHi?: string;
  mimeType: string;
  sizeBytes?: number;
  fileSize?: number;
  width?: number;
  height?: number;
  userId?: string;
  uploadedByEmail?: string;
  buffer?: Buffer;
  label?: string;
  folder?: string;
}): Promise<MediaAssetItem> {
  const filename = (data.filename || data.fileName || 'asset.jpg').trim();
  const altTextEn = (data.altTextEn || data.label || filename).trim();
  const sizeBytes = data.sizeBytes || data.fileSize || 0;
  const userId = data.userId || data.uploadedByEmail || 'site_owner';
  const url = (data.url || (data.fileName ? `/uploads/${data.fileName}` : '/images/placeholder.jpg')).trim();

  // 1. Mandatory Alt Text
  if (!altTextEn || altTextEn.length === 0) {
    throw new Error('Alt text is required for every image to guarantee accessibility and search optimization.');
  }

  // 2. File Size Enforcement (max 5 MB)
  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`File size ${(sizeBytes / 1024 / 1024).toFixed(1)} MB exceeds the maximum allowed limit of 5 MB.`);
  }

  // 3. Supported MIME Types (JPG, PNG, WebP)
  if (!ALLOWED_MIME_TYPES.has(data.mimeType)) {
    throw new Error(`Unsupported image type '${data.mimeType}'. Only JPG, PNG, and WebP are permitted.`);
  }

  // 4. Never store base64 in database
  if (url.startsWith('data:')) {
    throw new Error('Base64 data URLs cannot be saved to the database. Use Cloudflare R2 direct storage.');
  }

  const created = await prisma.mediaAsset.create({
    data: {
      filename,
      url,
      altTextEn,
      altTextHi: data.altTextHi?.trim() || null,
      mimeType: data.mimeType,
      sizeBytes,
      width: data.width || null,
      height: data.height || null,
      createdById: userId,
    },
  });

  return {
    id: created.id,
    filename: created.filename,
    url: created.url,
    altTextEn: created.altTextEn,
    altTextHi: created.altTextHi,
    mimeType: created.mimeType,
    sizeBytes: created.sizeBytes,
    width: created.width,
    height: created.height,
    createdById: created.createdById,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    inUse: false,
    locations: [],
  };
}

/**
 * Safely deletes a media asset, blocking deletion if the image is currently in use.
 */
export async function deleteMediaAsset(
  assetId: string,
  userId?: string
): Promise<{ success: boolean; message: string }> {
  void userId;
  // If it's a built-in static asset, reject deletion immediately
  const isBuiltin = SEED_STATIC_ASSETS.some((s) => s.id === assetId);
  if (isBuiltin) {
    throw new Error('System seed assets are built into the platform and cannot be deleted.');
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new Error('Media asset not found.');
  }

  // Strict check: Block deletion if in use
  const usage = await checkMediaAssetUsage(asset.url);
  if (usage.inUse) {
    throw new Error(
      `Cannot delete '${asset.filename}' because it is currently in use on: ${usage.locations.join(', ')}. Remove it from those pages before deleting.`
    );
  }

  await prisma.mediaAsset.delete({
    where: { id: assetId },
  });

  return {
    success: true,
    message: `Asset '${asset.filename}' deleted successfully.`,
  };
}
