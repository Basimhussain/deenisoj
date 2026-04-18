import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugqoqijakaxwisznczcw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncW9xaWpha2F4d2lzem5jemN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyNTE5MiwiZXhwIjoyMDkxODAxMTkyfQ.fOdhE6io5msuxBv1Al636JFa_0mlHobXch1I7gLL-cQ';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = new Date();
const dateAt = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString();

const fatwas = [
  // First 5 — marked is_important: true (oldest, so largest daysAgo)
  {
    question_en: 'Is it permissible to delay the Fajr prayer until after sunrise due to work obligations?',
    answer_en: 'No, it is not permissible to intentionally delay the Fajr prayer past its time (sunrise). The prayer has a fixed time, and missing it deliberately is a major sin. One should adjust their work schedule or sleep routine to ensure Fajr is prayed within its time. If one oversleeps unintentionally, they must pray it as soon as they wake up as a make-up (qadha).',
    category: 'Salah',
    is_public: true,
    is_important: true,
    published_at: dateAt(50),
    created_at: dateAt(50),
  },
  {
    question_en: 'What is the ruling on paying Zakat on gold jewellery that is regularly worn?',
    answer_en: 'According to the Hanafi madhab, Zakat is obligatory on gold jewellery that reaches the nisab (minimum threshold of 87.48g of gold) even if it is regularly worn, once a full lunar year has passed. Other madhabs, including the Shafi\'i and Hanbali, hold that jewellery worn for personal use is exempt. One should follow the ruling of their own madhab or consult a local scholar.',
    category: 'Zakat',
    is_public: true,
    is_important: true,
    published_at: dateAt(45),
    created_at: dateAt(45),
  },
  {
    question_en: 'Is a marriage contract valid without a wali (guardian) for the bride?',
    answer_en: 'The majority of scholars, including the Shafi\'i, Maliki, and Hanbali schools, hold that a wali is a necessary condition for a valid nikah. A marriage contracted without a wali is therefore invalid in these madhabs. The Hanafi school permits an adult woman of sound mind to contract her own marriage, though it is still considered strongly recommended to have a wali present.',
    category: 'Marriage',
    is_public: true,
    is_important: true,
    published_at: dateAt(40),
    created_at: dateAt(40),
  },
  {
    question_en: 'Is it permissible to take out a mortgage to purchase a home in a non-Muslim country?',
    answer_en: 'Conventional mortgages involve riba (interest), which is categorically prohibited in Islam. A number of contemporary scholars permit it under the principle of necessity (darurah) for Muslims living as minorities in non-Muslim countries, subject to strict conditions: there is no Islamic alternative available, renting is not a viable option, and the person is in genuine need of shelter. However, many scholars do not accept this position and urge Muslims to seek Sharia-compliant alternatives such as diminishing musharakah products offered by Islamic banks.',
    category: 'Finance',
    is_public: true,
    is_important: true,
    published_at: dateAt(35),
    created_at: dateAt(35),
  },
  {
    question_en: 'Does breaking wind invalidate the fast of Ramadan?',
    answer_en: 'No, breaking wind (passing gas) does not invalidate the fast. It does, however, break wudu (ablution), so one would need to renew their wudu before performing salah. The fast is only broken by things that enter the body cavity intentionally, such as eating, drinking, or sexual intercourse, not by things that exit the body.',
    category: 'Fasting',
    is_public: true,
    is_important: true,
    published_at: dateAt(30),
    created_at: dateAt(30),
  },
  // Last 5 — not marked as important
  {
    question_en: 'Is it permissible to listen to music with Islamic lyrics?',
    answer_en: 'Scholars differ on this. Many classical scholars held that all music involving instruments is prohibited. A number of contemporary scholars permit vocals-only nasheeds without instruments. Music with Islamic lyrics set to conventional instrumentation remains a contested area; the safer position is to avoid it, but one should consult a qualified scholar regarding their specific situation.',
    category: 'Halal & Haram',
    is_public: true,
    is_important: false,
    published_at: dateAt(20),
    created_at: dateAt(20),
  },
  {
    question_en: 'Can a woman lead the Jumu\'ah prayer for a congregation of women only?',
    answer_en: 'According to the majority of classical scholars (Hanafi, Maliki, Shafi\'i, Hanbali), it is permissible for a woman to lead other women in prayer, including the Jumu\'ah prayer, though her standing position differs (she stands in the middle of the row rather than in front). A small minority of scholars disallow it entirely. There is no scholarly consensus permitting a woman to lead a mixed congregation of men and women.',
    category: 'Salah',
    is_public: true,
    is_important: false,
    published_at: dateAt(15),
    created_at: dateAt(15),
  },
  {
    question_en: 'Is it obligatory to perform ghusl after a wet dream?',
    answer_en: 'Yes, ghusl (full ritual bath) becomes obligatory upon a person who experiences a wet dream (ihtilam) if they find evidence of ejaculation upon waking. If no fluid is found, ghusl is not required. This applies to both men and women.',
    category: 'Purification',
    is_public: true,
    is_important: false,
    published_at: dateAt(10),
    created_at: dateAt(10),
  },
  {
    question_en: 'Is it permissible to make dua in a language other than Arabic?',
    answer_en: 'Yes, it is permissible to make dua (supplication) in any language. While Arabic is preferred and encouraged, especially the duas transmitted from the Prophet ﷺ, Allah hears and responds to supplications in all languages. One may make personal dua in their native tongue, particularly when seeking heartfelt connection with Allah.',
    category: 'Dua & Dhikr',
    is_public: true,
    is_important: false,
    published_at: dateAt(5),
    created_at: dateAt(5),
  },
  {
    question_en: 'Is it permissible to use social media during the blessed days of Dhul Hijjah?',
    answer_en: 'Using social media is not inherently prohibited, but scholars advise that the first ten days of Dhul Hijjah are among the most virtuous days of the year and should be maximised in worship, dhikr, and good deeds. Excessive or idle use of social media that distracts from worship is discouraged. One should be intentional and use these days to increase in acts of obedience.',
    category: 'Contemporary Issues',
    is_public: true,
    is_important: false,
    published_at: dateAt(2),
    created_at: dateAt(2),
  },
];

const { data, error } = await supabase.from('fatwas').insert(fatwas).select();

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log(`Seeded ${data.length} fatwas successfully.`);
data.forEach((f, i) => {
  console.log(`  [${i + 1}] ${f.is_important ? '★ IMPORTANT' : '  regular  '} — ${f.question_en.slice(0, 60)}...`);
});
