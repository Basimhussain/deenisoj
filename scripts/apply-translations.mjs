// Applies Urdu translations to the fatwas table.
//
// Default: reads scripts/translations-todo.json (produced by dump script,
// entries keyed by `id`). Pass a path to use a different file.
//
// Entries may match by `id` (preferred) or by verbatim `question_en`
// (used for the seed translations file which pre-dates ID knowledge).
//
// Run:
//   node scripts/apply-translations.mjs                        # uses translations-todo.json
//   node scripts/apply-translations.mjs scripts/translations-seed.json

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugqoqijakaxwisznczcw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncW9xaWpha2F4d2lzem5jemN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyNTE5MiwiZXhwIjoyMDkxODAxMTkyfQ.fOdhE6io5msuxBv1Al636JFa_0mlHobXch1I7gLL-cQ';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputArg = process.argv[2];
const inputPath = inputArg
  ? path.resolve(inputArg)
  : path.join(__dirname, 'translations-todo.json');

let entries;
try {
  const raw = await readFile(inputPath, 'utf8');
  entries = JSON.parse(raw);
} catch (err) {
  console.error(`Failed to read ${inputPath}:`, err.message);
  process.exit(1);
}

if (!Array.isArray(entries)) {
  console.error('Input must be a JSON array.');
  process.exit(1);
}

let updated = 0;
let skipped = 0;
let failed = 0;

for (const entry of entries) {
  const { id, question_en, question_ur, answer_ur, fatwa_number } = entry;
  const qUr = (question_ur ?? '').trim();
  const aUr = (answer_ur ?? '').trim();
  const label = fatwa_number ? `#${fatwa_number}` : id ?? question_en?.slice(0, 40);

  if (!qUr && !aUr) {
    skipped += 1;
    continue;
  }

  let targetId = id;

  // Fallback to matching by verbatim question_en when id is absent.
  if (!targetId && question_en) {
    const { data: match, error: findErr } = await supabase
      .from('fatwas')
      .select('id')
      .eq('question_en', question_en)
      .maybeSingle();
    if (findErr) {
      console.error(`[${label}] Lookup failed:`, findErr.message);
      failed += 1;
      continue;
    }
    if (!match) {
      console.warn(`[${label}] No fatwa found with that question_en — skipping.`);
      skipped += 1;
      continue;
    }
    targetId = match.id;
  }

  if (!targetId) {
    console.warn(`[${label}] No id or question_en — skipping.`);
    skipped += 1;
    continue;
  }

  const update = {};
  if (qUr) update.question_ur = qUr;
  if (aUr) update.answer_ur = aUr;

  const { error } = await supabase
    .from('fatwas')
    .update(update)
    .eq('id', targetId);
  if (error) {
    console.error(`[${label}] Update failed:`, error.message);
    failed += 1;
  } else {
    updated += 1;
    console.log(
      `[${label}] Updated (${qUr ? 'Q' : '-'}${aUr ? 'A' : '-'})`
    );
  }
}

console.log(`\nDone. Updated: ${updated} · Skipped: ${skipped} · Failed: ${failed}`);
