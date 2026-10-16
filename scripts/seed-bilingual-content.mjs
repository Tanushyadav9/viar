import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { assertStagingEnvironment } from './guard-staging.mjs';

// Load .env
if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// Enforce staging isolation: refuse to run against production database
assertStagingEnvironment({ scriptName: 'scripts/seed-bilingual-content.mjs' });

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

const MODULE_HINDI_DATA = [
  {
    order: 1,
    titleHi: 'ज्योतिष शास्त्र का परिचय',
    descriptionHi: 'इस सत्र में आप ज्योतिष के मूलभूत सिद्धांतों, आकाशीय ग्रहों के प्रभाव और मानव जीवन में उनकी महत्ता को समझेंगे।',
  },
  {
    order: 2,
    titleHi: 'कुंडली की संरचना और उसका स्वरूप',
    descriptionHi: 'इस सत्र में आप वैदिक जन्मपत्रिका के 12 भावों के विन्यास और जन्म समय के आकाशीय मानचित्र का अध्ययन करेंगे।',
  },
  {
    order: 3,
    titleHi: 'बारह राशियां और उनका मानव जीवन में महत्व',
    descriptionHi: 'इस सत्र में आप मेष से मीन तक बारह राशियों के स्वभाव, पंचमहाभूत तत्वों और उनके स्वामी ग्रहों का अध्ययन करेंगे।',
  },
  {
    order: 4,
    titleHi: 'जन्म कुंडली और उसके भाव',
    descriptionHi: 'इस सत्र में आप जानेंगे कि जन्म पत्रिका में बारह भाव किस प्रकार जीवन के विभिन्न आयामों को नियंत्रित करते हैं।',
  },
  {
    order: 5,
    titleHi: 'बारह भाव और मानव जीवन में उनका गूढ़ अर्थ',
    descriptionHi: 'इस सत्र में आप धर्म, अर्थ, काम और मोक्ष भावों के साथ-साथ स्वास्थ्य, धन, कुटुंब, विवाह और कर्म का विश्लेषण सीखेंगे।',
  },
  {
    order: 6,
    titleHi: 'राशियां और उनके अधिपति ग्रह',
    descriptionHi: 'इस सत्र में आप प्रत्येक राशि के स्वामी ग्रह और उनके जीवन में पड़ने वाले विशेष प्रभावों का अध्ययन करेंगे।',
  },
  {
    order: 7,
    titleHi: 'ज्योतिष में ग्रहों के अंश और उनकी अवस्थाएं',
    descriptionHi: 'इस सत्र में आप ग्रहों के भोगांश (0° से 30°), बाल, कुमार, युवा, वृद्ध और मृत अवस्थाओं के फलादेश का रहस्य समझेंगे।',
  },
  {
    order: 8,
    titleHi: 'ग्रहों की परस्पर मित्रता और शत्रुता',
    descriptionHi: 'इस सत्र में आप नैसर्गिक और तात्कालिक मैत्री चक्र, सम संबंध और उनसे बनने वाले योगों का विश्लेषण करेंगे।',
  },
  {
    order: 9,
    titleHi: 'ग्रहों की दृष्टियां और उनका प्रभाव',
    descriptionHi: 'इस सत्र में आप सप्तम पूर्ण दृष्टि के अतिरिक्त मंगल, गुरु और शनि की विशेष दृष्टियों का फल जानेंगे।',
  },
  {
    order: 10,
    titleHi: 'ग्रहों की उच्च और नीच राशियां',
    descriptionHi: 'इस सत्र में आप ग्रहों की उच्चता, नीचता और नीचभंग राजयोग के फलित नियमों का अध्ययन करेंगे।',
  },
  {
    order: 11,
    titleHi: 'ज्योतिष में अस्त ग्रहों का फलादेश',
    descriptionHi: 'इस सत्र में आप सूर्य के सानिध्य से ग्रहों के अस्त होने की प्रक्रिया और उनके सूक्ष्म प्रभावों को समझेंगे।',
  },
  {
    order: 12,
    titleHi: 'वक्री ग्रह और उनका प्रभाव',
    descriptionHi: 'इस सत्र में आप वक्री ग्रहों के चेष्टा बल, पूर्व जन्म के कार्मिक ऋण और उनके वक्र फल को जानेंगे।',
  },
  {
    order: 13,
    titleHi: 'ग्रह युति और प्रमुख ज्योतिषीय योग',
    descriptionHi: 'इस सत्र में आप दो या अधिक ग्रहों की युति से निर्मित होने वाले शुभ और अशुभ योगों का विश्लेषण करेंगे।',
  },
  {
    order: 14,
    titleHi: 'राहु और केतु — छाया ग्रहों का रहस्य',
    descriptionHi: 'इस सत्र में आप राहु और केतु के कार्मिक अक्ष, भ्रम, शोध और आध्यात्मिक मुक्ति में उनकी भूमिका समझेंगे।',
  },
  {
    order: 15,
    titleHi: 'पंचांग और शुभ मुहूर्त का आधार',
    descriptionHi: 'इस सत्र में आप तिथि, वार, नक्षत्र, योग और करण के समन्वय से शुभ काल चयन की विधि सीखेंगे।',
  },
  {
    order: 16,
    titleHi: 'सताईस नक्षत्र और उनका महत्व',
    descriptionHi: 'इस सत्र में आप अश्विनी से रेवती तक 27 नक्षत्रों के अधिपति देव, स्वभाव और नक्षत्र पदों का अध्ययन करेंगे।',
  },
  {
    order: 17,
    titleHi: 'दशा विचार — विंशोत्तरी महादशा',
    descriptionHi: 'इस सत्र में आप 120 वर्षीय विंशोत्तरी महादशा और अंतर्दशा से समय के फलन का सटीक गणित सीखेंगे।',
  },
  {
    order: 18,
    titleHi: 'ग्रह गोचर और समय निर्धारण',
    descriptionHi: 'इस सत्र में आप जन्म लग्न और चंद्र कुंडली से शनि, गुरु, राहु-केतु के गोचर का फल जानेंगे।',
  },
  {
    order: 19,
    titleHi: 'नवांश चक्र की आधारशिला',
    descriptionHi: 'इस सत्र में आप सूक्ष्म फलित, दांपत्य जीवन और भाग्य की आंतरिक शक्ति का नवांश से परीक्षण सीखेंगे।',
  },
  {
    order: 20,
    titleHi: 'वैदिक उपाय और रत्न विज्ञान के सिद्धांत',
    descriptionHi: 'इस सत्र में आप शास्त्रीय मंत्र, दान, व्रत और वैज्ञानिक रत्न चयन के प्रामाणिक नियम सीखेंगे।',
  },
  {
    order: 21,
    titleHi: 'आजीविका, व्यवसाय और धन योग',
    descriptionHi: 'इस सत्र में आप दशम भाव, एकादश भाव, धनेश और कर्मेश के समन्वय से करियर मार्गदर्शन सीखेंगे।',
  },
  {
    order: 22,
    titleHi: 'विवाह मिलान और संबंध विचार',
    descriptionHi: 'इस सत्र में आप अष्टकूट गुण मिलान के आगे बढ़कर ग्रहों की अनुकूलता और मांगलिक विचार का विश्लेषण करेंगे।',
  },
  {
    order: 23,
    titleHi: 'स्वास्थ्य, आयु विचार और रोग निदान',
    descriptionHi: 'इस सत्र में आप षष्ठ, अष्टम और द्वादश भाव से रोग की प्रकृति और स्वास्थ्य रक्षा के उपाय सीखेंगे।',
  },
  {
    order: 24,
    titleHi: 'विशेष कार्यशाला: व्यावहारिक जन्मपत्रिका विश्लेषण',
    descriptionHi: 'आचार्य नीरज कुमार के साथ वास्तविक कुंडलियों पर प्रत्यक्ष फलादेश और चरणबद्ध विश्लेषण अभ्यास।',
  },
];

async function main() {
  console.log('[Seed] Updating courses with authentic Hindi metadata...');

  // 1. Update Flagship Course
  const flagship = await prisma.course.findUnique({
    where: { slug: 'what-is-astrology' },
    include: { modules: { include: { lessons: true } } },
  });

  if (flagship) {
    await prisma.course.update({
      where: { id: flagship.id },
      data: {
        titleHi: 'ज्योतिष क्या है — वैदिक ज्योतिष की आधारशिला',
        shortDescriptionHi: '23 सुव्यवस्थित वीडियो मॉड्यूल, 2 व्यावहारिक कुंडली कार्यशालाओं और प्रामाणिक प्रमाणपत्र के साथ प्रामाणिक वैदिक ज्योतिष सीखें।',
        descriptionHi: 'आचार्य नीरज कुमार द्वारा निर्देशित शास्त्रीय पाराशरी ज्योतिष का आधारभूत मास्टरक्लास। 23 संरचित वीडियो व्याख्यानों, अध्ययन नोट्स, और व्यावहारिक कुंडली विश्लेषण के माध्यम से वैदिक ज्योतिष के मूल सिद्धांतों में महारत हासिल करें।',
      },
    });
    console.log(`[Seed] Updated flagship course "${flagship.title}" with Hindi metadata.`);

    // 2. Update Modules
    for (const mod of flagship.modules) {
      const match = MODULE_HINDI_DATA.find((m) => m.order === mod.order);
      if (match) {
        await prisma.module.update({
          where: { id: mod.id },
          data: {
            titleHi: match.titleHi,
            descriptionHi: match.descriptionHi,
          },
        });

        // 3. Batch Update Lessons in module
        await prisma.lesson.updateMany({
          where: { moduleId: mod.id },
          data: {
            titleHi: `${match.titleHi} — वीडियो पाठ`,
            descriptionHi: match.descriptionHi,
          },
        });
      }
    }
    console.log(`[Seed] Updated ${flagship.modules.length} modules and their lessons in flagship course.`);
  }

  // 4. Update other courses
  const otherCourses = [
    {
      slug: 'vastu-shastra',
      titleHi: 'वास्तु शास्त्र — अंतरिक्ष, ऊर्जा और दिशाओं का विज्ञान',
      shortDescriptionHi: 'प्राचीन वैदिक सिद्धांतों के साथ आवासीय और व्यावसायिक स्थानों के ऊर्जा संतुलन की कला सीखें।',
    },
    {
      slug: 'gemstones',
      titleHi: 'रत्न विज्ञान — ग्रह ऊर्जा और उपचारात्मक प्रभाव',
      shortDescriptionHi: 'नौ ग्रहों के रत्नों, धातु चयन और उनके उपचारात्मक प्रभावों का वैज्ञानिक अध्ययन।',
    },
    {
      slug: 'numerology',
      titleHi: 'अंक ज्योतिष — अंक, नाम और भाग्य का विज्ञान',
      shortDescriptionHi: 'मूलांक, भाग्यांक और नामांक के सामंजस्य से जीवन मार्गदर्शन की प्रामाणिक पद्धति।',
    },
    {
      slug: 'tarot-reading',
      titleHi: 'टैरो कार्ड रीडिंग — अंतर्ज्ञान और प्रतीकात्मक मार्गदर्शन',
      shortDescriptionHi: '78 टैरो कार्ड्स के प्रतीकों और अंतर्ज्ञान के माध्यम से जीवन मार्गदर्शन सीखें।',
    },
  ];

  for (const c of otherCourses) {
    const found = await prisma.course.findUnique({ where: { slug: c.slug } });
    if (found) {
      await prisma.course.update({
        where: { id: found.id },
        data: {
          titleHi: c.titleHi,
          shortDescriptionHi: c.shortDescriptionHi,
        },
      });
      console.log(`[Seed] Updated catalog course "${c.slug}" with Hindi metadata.`);
    }
  }

  console.log('[Seed] Bilingual course seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
