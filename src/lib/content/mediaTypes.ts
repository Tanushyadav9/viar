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

export const SEED_STATIC_ASSETS: MediaAssetItem[] = [
  {
    id: 'media-acharya-headshot',
    filename: 'Acharya_Niraj_Kumar_Headshot.jpg',
    url: '/images/Acharya_Niraj_Kumar_Headshot.jpg',
    altTextEn: 'Acharya Niraj Kumar Master Astrologer Headshot',
    altTextHi: 'आचार्य नीरज कुमार मुख्य ज्योतिषी चित्र',
    mimeType: 'image/jpeg',
    sizeBytes: 245000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'media-acharya-solo',
    filename: 'Acharya_Niraj_Kumar_Solo.jpg',
    url: '/images/Acharya_Niraj_Kumar_Solo.jpg',
    altTextEn: 'Acharya Niraj Kumar Vedic Jyotish Consultant',
    altTextHi: 'आचार्य नीरज कुमार वैदिक ज्योतिष परामर्शदाता',
    mimeType: 'image/jpeg',
    sizeBytes: 310000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'media-logo-icon',
    filename: 'logo-icon.png',
    url: '/images/logo-icon.png',
    altTextEn: 'VIAR Institute Golden Emblem Logo',
    altTextHi: 'विहंगम संस्थान स्वर्ण प्रतीक चिन्ह',
    mimeType: 'image/png',
    sizeBytes: 45000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'media-gallery-award',
    filename: 'Shivjyoti_Best_Astrologer_Award.jpg',
    url: '/images/gallery/Shivjyoti_Best_Astrologer_Award.jpg',
    altTextEn: 'Shivjyoti Best Astrologer Felicitation Award',
    altTextHi: 'शिवज्योति सर्वश्रेष्ठ ज्योतिषी सम्मान पुरस्कार',
    mimeType: 'image/jpeg',
    sizeBytes: 380000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'media-gallery-cert',
    filename: 'Jyotish_Acharya_Certificate.png',
    url: '/images/gallery/Jyotish_Acharya_Certificate.png',
    altTextEn: 'Jyotish Acharya Academic Credential Certificate',
    altTextHi: 'ज्योतिष आचार्य शैक्षणिक प्रमाणपत्र',
    mimeType: 'image/png',
    sizeBytes: 520000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];
