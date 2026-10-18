import { NextRequest, NextResponse } from 'next/server';
import { getContentItem, getCollectionItems } from '@/lib/content/contentService';
import { BUILTIN_CONTENT_DEFAULTS } from '@/lib/content/defaultContent';

export const dynamic = 'force-dynamic';

/**
 * Public Content API
 * 
 * Provides safe, public read-only access to published website content.
 * GUARANTEES:
 * 1. Never returns drafts or hidden items to the general public.
 * 2. If the database is unreachable or table is empty, immediately falls back to built-in defaults.
 * 3. Never throws 500 or crashes public visitors.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collection = (searchParams.get('collection') || 'site_settings').toLowerCase();
    const key = searchParams.get('key');

    if (key) {
      const item = await getContentItem(collection, key);
      return NextResponse.json({
        success: true,
        item,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    const items = await getCollectionItems(collection, {
      includeHidden: false,
      includeDrafts: false,
    });

    return NextResponse.json({
      success: true,
      collection,
      items,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.warn('[PublicContentAPI] Error handling request, returning fallback defaults:', error);
    const collection = 'site_settings';
    const defaults = BUILTIN_CONTENT_DEFAULTS[collection] || [];
    return NextResponse.json({
      success: true,
      collection,
      items: defaults,
      fallback: true,
    });
  }
}
