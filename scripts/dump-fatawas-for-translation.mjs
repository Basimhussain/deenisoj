// Dumps every published fatwa that is missing a Urdu question or answer
// into scripts/translations-todo.json so an Urdu translation pass can be
// prepared offline. Run: `node scripts/dump-fatawas-for-translation.mjs`
//
// Credentials mirror the pattern used in scripts/seed-fatwas.mjs.

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugqoqijakaxwisznczcw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncW9xaWpha2F4d2lzem5jemN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyNTE5MiwiZXhwIjoyMDkxODAxMTkyfQ.fOdhE6io5msuxBv1Al636JFa_0mlHobXch1I7gLL-cQ';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from('fatwas')
  .select('id, fatwa_number, category, question_en, question_ur, answer_en, answer_ur')
  .order('fatwa_number', { ascending: true });

if (error) {
  console.error('Dump failed:', error.message);
  process.exit(1);
}

const pending = (data ?? []).filter((f) => !f.question_ur || !f.answer_ur);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'translations-todo.json');

await mkdir(__dirname, { recursive: true });
await writeFile(
  outPath,
  JSON.stringify(
    pending.map((f) => ({
      id: f.id,
      fatwa_number: f.fatwa_number,
      category: f.category,
      question_en: f.question_en,
      answer_en: f.answer_en,
      question_ur: f.question_ur ?? '',
      answer_ur: f.answer_ur ?? '',
    })),
    null,
    2
  ),
  'utf8'
);

console.log(`Wrote ${pending.length} pending translation(s) to ${outPath}`);
console.log('Next steps:');
console.log('  1. Fill in the question_ur / answer_ur fields in that file.');
console.log('  2. Run: node scripts/apply-translations.mjs');
