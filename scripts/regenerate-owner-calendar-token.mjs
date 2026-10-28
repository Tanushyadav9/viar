import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Regenerating Owner Calendar Feed Token with >= 32 bytes entropy...');
  
  // 32 bytes cryptographic entropy (64 hex characters)
  const secureRandomHex = crypto.randomBytes(32).toString('hex');
  const rawToken = `sec_vcal_${secureRandomHex}`;
  
  // SHA-256 hash
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  // Masked string (prefix + 16 bullets + last 4 characters)
  const maskedToken = `sec_vcal_••••••••••••••••${rawToken.slice(-4)}`;
  
  console.log('Entropy bytes:', 32);
  console.log('Hex length:', secureRandomHex.length);
  console.log('SHA-256 Hash:', tokenHash);
  console.log('Masked Token:', maskedToken);
  
  const record = await prisma.contentItem.upsert({
    where: {
      collection_key: {
        collection: 'site_settings',
        key: 'owner_calendar_feed_token_hash',
      },
    },
    create: {
      collection: 'site_settings',
      key: 'owner_calendar_feed_token_hash',
      titleEn: 'Owner Calendar Feed Token Hash',
      titleHi: 'मालिक कैलेंडर फ़ीड टोकन हैश',
      contentEn: maskedToken,
      metadata: {
        tokenHash,
        algorithm: 'sha256',
        entropyBytes: 32,
        regeneratedAt: new Date().toISOString(),
      },
      status: 'PUBLISHED',
    },
    update: {
      contentEn: maskedToken,
      metadata: {
        tokenHash,
        algorithm: 'sha256',
        entropyBytes: 32,
        regeneratedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    },
  });

  console.log('Successfully persisted to database! ContentItem ID:', record.id);
  console.log('Old token is permanently invalidated.');
}

main()
  .catch((err) => {
    console.error('Failed to regenerate token in database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
