import fs from 'node:fs';

// 1. Update src/components/Footer.tsx
const footerPath = 'src/components/Footer.tsx';
let footerContent = fs.readFileSync(footerPath, 'utf8');

// Replacement 1: 23 Video Modules in trust strip
const oldFooter1 = `{isHi ? '23 वीडियो मॉड्यूल' : '23 Video Modules'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'विस्तृत ऑन-डिमांड पाठ्यक्रम + 2 बोनस कुंडली विश्लेषण मास्टरक्लास आजीवन पहुंच के साथ।'
                  : 'Comprehensive on-demand curriculum + 2 bonus chart reading masterclasses with lifetime access.'}`;

const newFooter1 = `{isHi ? 'रिकॉर्डेड मॉड्यूल एवं 1-on-1 सत्र' : 'Recorded Modules & 1-on-1 Sessions'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'संरचित रिकॉर्डेड पाठ्यक्रम और व्यक्तिगत 1-on-1 मार्गदर्शन सत्र (क्लाइंट अनुमोदन लंबित)।'
                  : 'Structured recorded curriculum modules paired with personal 1-on-1 mentorship sessions (pending client approval).'}`;

// Replacement 2: Learn at Your Own Pace in trust strip
const oldFooter2 = `{isHi ? 'अपनी गति से सीखें' : 'Learn at Your Own Pace'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'विश्व में कहीं से भी 100% सेल्फ-पेस्ड। कोई समय-सारिणी या निश्चित समय का दबाव नहीं।'
                  : '100% self-paced from anywhere in the world. No live scheduling conflicts or rigid timetables.'}`;

const newFooter2 = `{isHi ? 'लचीला एवं व्यक्तिगत अध्ययन' : 'Self-Paced & Personal Mentorship'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHi
                  ? 'अपनी गति से रिकॉर्डेड व्याख्यान देखें, और आपसी सुविधानुसार 1-on-1 सत्र निर्धारित करें (क्लाइंट अनुमोदन लंबित)।'
                  : 'Study recorded lessons at your own pace, with personal 1-on-1 sessions scheduled by mutual convenience (pending client approval).'}`;

// Replacement 3: Quick links in footer
const oldFooter3 = `{isHi ? '23 वीडियो मॉड्यूल एवं मास्टरक्लास' : '23 Video Modules & Masterclasses'}`;
const newFooter3 = `{isHi ? 'रिकॉर्डेड मॉड्यूल एवं 1-on-1 सत्र' : 'Recorded Modules & 1-on-1 Sessions'}`;

// Normalize line endings for replacement
function replaceNormalizing(str, target, replacement) {
  // Try CRLF
  const targetCRLF = target.replace(/\r?\n/g, '\r\n');
  const repCRLF = replacement.replace(/\r?\n/g, '\r\n');
  if (str.includes(targetCRLF)) {
    return str.replace(targetCRLF, repCRLF);
  }
  // Try LF
  const targetLF = target.replace(/\r?\n/g, '\n');
  const repLF = replacement.replace(/\r?\n/g, '\n');
  if (str.includes(targetLF)) {
    return str.replace(targetLF, repLF);
  }
  throw new Error(`Target not found in file: ${target.substring(0, 40)}...`);
}

footerContent = replaceNormalizing(footerContent, oldFooter1, newFooter1);
footerContent = replaceNormalizing(footerContent, oldFooter2, newFooter2);
footerContent = replaceNormalizing(footerContent, oldFooter3, newFooter3);
fs.writeFileSync(footerPath, footerContent, 'utf8');
console.log('Successfully updated src/components/Footer.tsx');

// 2. Update src/app/page.tsx
const pagePath = 'src/app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

const oldPage1 = `<h4 className="text-xl font-bold text-white mb-3">
                  {isHi ? '23 ऑन-डिमांड वीडियो मॉड्यूल' : '23 On-Demand Video Modules'}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi
                    ? 'आचार्य नीरज कुमार द्वारा पढ़ाया गया आधारशिला से उन्नत स्तर तक का संपूर्ण पाठ्यक्रम। आजीवन पहुंच, डाउनलोड करने योग्य कुंडली टेम्पलेट और अध्ययन नोट्स के साथ जब चाहें देखें, रोकें और दोहराएं।'
                    : 'Complete foundational-to-advanced curriculum taught by Acharya Niraj Kumar. Pause, rewind, and re-watch anytime with lifetime access, downloadable chart templates, and study cheatsheets.'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isHi ? 'सभी मोबाइल और लैपटॉप उपकरणों पर आजीवन असीमित पहुंच' : 'Lifetime access on all mobile & desktop devices'}</span>`;

const newPage1 = `<h4 className="text-xl font-bold text-white mb-3">
                  {isHi ? 'रिकॉर्डेड मॉड्यूल एवं 1-on-1 सत्र' : 'Recorded Modules & 1-on-1 Sessions'}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi
                    ? 'आचार्य नीरज कुमार द्वारा पढ़ाया गया संरचित पाठ्यक्रम, व्यक्तिगत 1-on-1 मार्गदर्शन सत्रों के साथ (क्लाइंट अनुमोदन लंबित)।'
                    : 'Foundational-to-advanced structured curriculum taught by Acharya Niraj Kumar, paired with personal 1-on-1 mentorship sessions (pending client approval).'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isHi ? 'रिकॉर्डेड पाठ्यक्रम और व्यक्तिगत 1-on-1 मार्गदर्शन' : 'Recorded modules and personal 1-on-1 mentorship'}</span>`;

const oldPage2 = `<h4 className="text-xl font-bold text-white mb-3">
                  {isHi ? '100% अपनी गति से सीखें • कोई समय-सीमा का तनाव नहीं' : '100% Self-Paced • Zero Schedule Stress'}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi
                    ? 'ज़ूम कक्षाओं के समय का कोई दबाव या टाइमज़ोन का टकराव नहीं। अपनी व्यक्तिगत और व्यावसायिक जीवनशैली के अनुसार गति तय करें, साथ ही सक्रिय शंका-समाधान की सुविधा।'
                    : 'No live Zoom scheduling pressure or timezone conflicts. Progress at whatever pace fits your personal and professional lifestyle, with active academic discussion support.'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{isHi ? 'विश्व में कहीं से भी अपनी गति से अध्ययन करें' : 'Learn at your own pace from anywhere in the world'}</span>`;

const newPage2 = `<h4 className="text-xl font-bold text-white mb-3">
                  {isHi ? 'लचीला अध्ययन एवं व्यक्तिगत मार्गदर्शन' : 'Flexible Self-Paced & 1-on-1 Sessions'}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi
                    ? 'अपनी गति से रिकॉर्डेड व्याख्यान देखें, और आपसी सुविधानुसार व्यक्तिगत 1-on-1 सत्र निर्धारित करें (क्लाइंट अनुमोदन लंबित)।'
                    : 'Study recorded lessons at your own pace, with personal 1-on-1 sessions scheduled at mutually convenient times (pending client approval).'}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{isHi ? 'विश्व में कहीं से भी अध्ययन और व्यक्तिगत मार्गदर्शन' : 'Learn from anywhere with personal 1-on-1 mentorship'}</span>`;

pageContent = replaceNormalizing(pageContent, oldPage1, newPage1);
pageContent = replaceNormalizing(pageContent, oldPage2, newPage2);
fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('Successfully updated src/app/page.tsx');
