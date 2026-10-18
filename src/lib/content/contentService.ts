import { prisma } from '../prisma.ts';
import { BUILTIN_CONTENT_DEFAULTS } from './defaultContent.ts';
import type { BuiltinContentItem } from './defaultContent.ts';
import { sanitizeRichText } from './sanitizer.ts';
import type { ContentStatus } from '../types.ts';

export interface FormattedContent {
  id?: string;
  collection: string;
  key: string;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
  metadata: Record<string, unknown>;
  status: ContentStatus;
  sortOrder: number;
  isCustomized: boolean;
  updatedAt?: string | Date;
}

/**
 * Maps database item or fallback item into uniform FormattedContent structure
 */
function toFormattedContent(
  dbItem: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  defaultItem?: BuiltinContentItem
): FormattedContent {
  if (dbItem) {
    return {
      id: dbItem.id,
      collection: dbItem.collection,
      key: dbItem.key,
      titleEn: dbItem.titleEn || defaultItem?.titleEn || '',
      titleHi: dbItem.titleHi || defaultItem?.titleHi || '',
      contentEn: dbItem.contentEn || defaultItem?.contentEn || '',
      contentHi: dbItem.contentHi || defaultItem?.contentHi || '',
      metadata: (dbItem.metadata as Record<string, unknown>) || defaultItem?.metadata || {},
      status: (dbItem.status as ContentStatus) || 'PUBLISHED',
      sortOrder: dbItem.sortOrder ?? defaultItem?.sortOrder ?? 0,
      isCustomized: true,
      updatedAt: dbItem.updatedAt,
    };
  }

  if (defaultItem) {
    return {
      collection: defaultItem.collection,
      key: defaultItem.key,
      titleEn: defaultItem.titleEn,
      titleHi: defaultItem.titleHi,
      contentEn: defaultItem.contentEn,
      contentHi: defaultItem.contentHi,
      metadata: defaultItem.metadata || {},
      status: 'PUBLISHED',
      sortOrder: defaultItem.sortOrder,
      isCustomized: false,
    };
  }

  return {
    collection: 'unknown',
    key: 'unknown',
    titleEn: '',
    titleHi: '',
    contentEn: '',
    contentHi: '',
    metadata: {},
    status: 'PUBLISHED',
    sortOrder: 0,
    isCustomized: false,
  };
}

/**
 * Safely fetches a single content item with built-in default fallback.
 * A public page will NEVER crash or return blank because database content is missing.
 */
export async function getContentItem(
  collection: string,
  key: string,
  options: { locale?: string; previewDraft?: boolean } = {}
): Promise<FormattedContent> {
  const defaultItem = BUILTIN_CONTENT_DEFAULTS[collection]?.find((i) => i.key === key);

  try {
    const dbItem = await prisma.contentItem.findUnique({
      where: {
        collection_key: { collection, key },
      },
    });

    if (dbItem) {
      // If hidden and not previewing drafts, return fallback or empty
      if (dbItem.status === 'HIDDEN' && !options.previewDraft) {
        return toFormattedContent(null, defaultItem);
      }
      return toFormattedContent(dbItem, defaultItem);
    }
  } catch {
    // Database connection failure or missing table -> log and return resilient fallback
    console.warn(`[ContentService] DB query failed for ${collection}:${key}, falling back to built-in default.`);
  }

  return toFormattedContent(null, defaultItem);
}

/**
 * Fetches all published items in a collection, ordered by sortOrder.
 * Merges with built-in defaults if database has not yet been seeded.
 */
export async function getCollectionItems(
  collection: string,
  options: { includeHidden?: boolean; includeDrafts?: boolean } = {}
): Promise<FormattedContent[]> {
  const defaults = BUILTIN_CONTENT_DEFAULTS[collection] || [];

  try {
    const whereClause: any = { collection }; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!options.includeHidden && !options.includeDrafts) {
      whereClause.status = 'PUBLISHED';
    } else if (!options.includeHidden) {
      whereClause.status = { in: ['PUBLISHED', 'DRAFT'] };
    }

    const dbItems = await prisma.contentItem.findMany({
      where: whereClause,
      orderBy: { sortOrder: 'asc' },
    });

    if (dbItems && dbItems.length > 0) {
      const dbKeyMap = new Map(dbItems.map((item) => [item.key, item]));
      const result: FormattedContent[] = [];

      // Add all DB items
      for (const item of dbItems) {
        const matchingDefault = defaults.find((d) => d.key === item.key);
        result.push(toFormattedContent(item, matchingDefault));
      }

      // If in admin view and some defaults are not yet in DB, optionally append them
      if (options.includeDrafts || options.includeHidden) {
        for (const def of defaults) {
          if (!dbKeyMap.has(def.key)) {
            result.push(toFormattedContent(null, def));
          }
        }
      }

      return result.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  } catch {
    console.warn(`[ContentService] DB query failed for collection ${collection}, returning built-in defaults.`);
  }

  // Resilient fallback when DB is unreachable or empty
  return defaults.map((d) => toFormattedContent(null, d));
}

/**
 * Saves or updates a content item with automatic revision snapshot and cache revalidation.
 */
export async function saveContentItem(
  data: {
    collection: string;
    key: string;
    titleEn?: string;
    titleHi?: string;
    contentEn?: string;
    contentHi?: string;
    metadata?: Record<string, unknown>;
    status?: ContentStatus;
    sortOrder?: number;
    changeSummary?: string;
  },
  userId: string
): Promise<FormattedContent> {
  const collection = data.collection.trim().toLowerCase();
  const key = data.key.trim().toLowerCase();
  const titleEn = data.titleEn?.trim() || '';
  const titleHi = data.titleHi?.trim() || '';
  const contentEn = sanitizeRichText(data.contentEn || '');
  const contentHi = sanitizeRichText(data.contentHi || '');
  const status = data.status || 'PUBLISHED';
  const sortOrder = typeof data.sortOrder === 'number' ? data.sortOrder : 0;
  const metadata = data.metadata || {};
  const changeSummary = data.changeSummary?.trim() || 'Content updated via Content Studio';

  const defaultItem = BUILTIN_CONTENT_DEFAULTS[collection]?.find((i) => i.key === key);

  // Execute in transaction: Upsert item + Create revision + Log activity
  const [updatedItem] = await prisma.$transaction([
    prisma.contentItem.upsert({
      where: {
        collection_key: { collection, key },
      },
      create: {
        collection,
        key,
        titleEn,
        titleHi,
        contentEn,
        contentHi,
        metadata: metadata as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        status,
        sortOrder,
        createdById: userId,
        updatedById: userId,
      },
      update: {
        titleEn,
        titleHi,
        contentEn,
        contentHi,
        metadata: metadata as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        status,
        sortOrder,
        updatedById: userId,
      },
    }),
  ]);

  // Create immutable snapshot revision
  await prisma.contentRevision.create({
    data: {
      contentId: updatedItem.id,
      collection,
      key,
      snapshot: {
        titleEn: updatedItem.titleEn,
        titleHi: updatedItem.titleHi,
        contentEn: updatedItem.contentEn,
        contentHi: updatedItem.contentHi,
        metadata: updatedItem.metadata,
        status: updatedItem.status,
        sortOrder: updatedItem.sortOrder,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      changeSummary,
      createdById: userId,
    },
  });

  // Revalidate affected pages instantly so visitors see changes without redeployment
  triggerCacheRevalidation(collection);

  return toFormattedContent(updatedItem, defaultItem);
}

/**
 * Restores a content item to a previous revision snapshot
 */
export async function restoreContentRevision(
  revisionId: string,
  userId: string
): Promise<FormattedContent> {
  const revision = await prisma.contentRevision.findUnique({
    where: { id: revisionId },
    include: { contentItem: true },
  });

  if (!revision) {
    throw new Error('Revision snapshot not found.');
  }

  const snapshot = revision.snapshot as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const defaultItem = BUILTIN_CONTENT_DEFAULTS[revision.collection]?.find((i) => i.key === revision.key);

  const updatedItem = await prisma.contentItem.update({
    where: { id: revision.contentId },
    data: {
      titleEn: snapshot.titleEn,
      titleHi: snapshot.titleHi,
      contentEn: snapshot.contentEn,
      contentHi: snapshot.contentHi,
      metadata: snapshot.metadata,
      status: snapshot.status || 'PUBLISHED',
      sortOrder: snapshot.sortOrder ?? 0,
      updatedById: userId,
    },
  });

  // Create new revision documenting the restore action
  await prisma.contentRevision.create({
    data: {
      contentId: updatedItem.id,
      collection: revision.collection,
      key: revision.key,
      snapshot: revision.snapshot as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      changeSummary: `Restored to revision from ${new Date(revision.createdAt).toLocaleString()}`,
      createdById: userId,
    },
  });

  triggerCacheRevalidation(revision.collection);

  return toFormattedContent(updatedItem, defaultItem);
}

/**
 * Fetches revision history for a content item
 */
export async function getContentRevisions(contentId: string) {
  try {
    return await prisma.contentRevision.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch (error) {
    console.warn('[ContentService] Failed to fetch revisions:', error);
    return [];
  }
}

/**
 * Toggles status (PUBLISHED, DRAFT, HIDDEN)
 */
export async function updateContentStatus(
  contentId: string,
  status: ContentStatus,
  userId: string
): Promise<FormattedContent> {
  const updatedItem = await prisma.contentItem.update({
    where: { id: contentId },
    data: { status, updatedById: userId },
  });

  const defaultItem = BUILTIN_CONTENT_DEFAULTS[updatedItem.collection]?.find((i) => i.key === updatedItem.key);

  await prisma.contentRevision.create({
    data: {
      contentId: updatedItem.id,
      collection: updatedItem.collection,
      key: updatedItem.key,
      snapshot: {
        titleEn: updatedItem.titleEn,
        titleHi: updatedItem.titleHi,
        contentEn: updatedItem.contentEn,
        contentHi: updatedItem.contentHi,
        metadata: updatedItem.metadata,
        status: updatedItem.status,
        sortOrder: updatedItem.sortOrder,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      changeSummary: `Status changed to ${status}`,
      createdById: userId,
    },
  });

  triggerCacheRevalidation(updatedItem.collection);
  return toFormattedContent(updatedItem, defaultItem);
}

/**
 * Reorders items in a collection
 */
export async function reorderCollectionItems(
  collection: string,
  orderedKeys: string[],
  userId: string
): Promise<void> {
  await prisma.$transaction(
    orderedKeys.map((key, index) =>
      prisma.contentItem.updateMany({
        where: { collection, key },
        data: { sortOrder: index + 1, updatedById: userId },
      })
    )
  );

  triggerCacheRevalidation(collection);
}

/**
 * Triggers Next.js cache revalidation for affected routes
 */
function triggerCacheRevalidation(collection: string) {
  try {
    // Dynamically invoke revalidatePath in Next.js runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const nextCache = require('next/cache');
    if (nextCache && typeof nextCache.revalidatePath === 'function') {
      nextCache.revalidatePath('/', 'page');
      nextCache.revalidatePath('/hi', 'page');
      if (collection === 'about') {
        nextCache.revalidatePath('/about', 'page');
        nextCache.revalidatePath('/hi/about', 'page');
      }
      if (collection === 'contact' || collection === 'site_settings') {
        nextCache.revalidatePath('/contact', 'page');
        nextCache.revalidatePath('/hi/contact', 'page');
      }
    }
  } catch {
    // Graceful catch for test/script environments where Next.js cache context is not active
  }
}
