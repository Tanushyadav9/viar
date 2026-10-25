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
