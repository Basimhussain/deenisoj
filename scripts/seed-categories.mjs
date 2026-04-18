import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugqoqijakaxwisznczcw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncW9xaWpha2F4d2lzem5jemN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyNTE5MiwiZXhwIjoyMDkxODAxMTkyfQ.fOdhE6io5msuxBv1Al636JFa_0mlHobXch1I7gLL-cQ';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const categories = [
  { name: 'Salah',                slug: 'salah',                description: 'Prayer — obligations, conditions, and rulings.',        sort_order: 1 },
  { name: 'Zakat',                slug: 'zakat',                description: 'Obligatory almsgiving and its conditions.',             sort_order: 2 },
  { name: 'Fasting',              slug: 'fasting',              description: 'Rulings related to sawm and Ramadan.',                  sort_order: 3 },
  { name: 'Marriage',             slug: 'marriage',             description: 'Nikah, divorce, and family law.',                      sort_order: 4 },
  { name: 'Finance',              slug: 'finance',              description: 'Islamic finance, riba, and business dealings.',         sort_order: 5 },
  { name: 'Purification',         slug: 'purification',         description: 'Taharah — wudu, ghusl, and ritual cleanliness.',       sort_order: 6 },
  { name: 'Halal & Haram',        slug: 'halal-haram',          description: 'Permissible and impermissible acts and consumption.',   sort_order: 7 },
  { name: 'Dua & Dhikr',          slug: 'dua-dhikr',            description: 'Supplication, remembrance, and related rulings.',      sort_order: 8 },
  { name: 'Contemporary Issues',  slug: 'contemporary-issues',  description: 'Modern questions not directly addressed in classics.',  sort_order: 9 },
];

const { data, error } = await supabase.from('categories').insert(categories).select();

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log(`Seeded ${data.length} categories:`);
data.forEach(c => console.log(`  [${c.sort_order}] ${c.name} (/${c.slug})`));
