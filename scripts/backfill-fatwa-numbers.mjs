/**
 * Run this AFTER executing db/fatwas_numbering.sql in the Supabase SQL editor.
 * It re-numbers all fatwas in chronological order and sets the sequence ceiling.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugqoqijakaxwisznczcw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncW9xaWpha2F4d2lzem5jemN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyNTE5MiwiZXhwIjoyMDkxODAxMTkyfQ.fOdhE6io5msuxBv1Al636JFa_0mlHobXch1I7gLL-cQ';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: fatwas, error } = await supabase
  .from('fatwas')
  .select('id, published_at, created_at, fatwa_number')
  .order('published_at', { ascending: true, nullsFirst: false });

if (error) {
  console.error('Fetch failed:', error.message);
  process.exit(1);
}

// Sort: published first (by published_at), unpublished after (by created_at)
const sorted = [...fatwas].sort((a, b) => {
  const aDate = a.published_at ?? a.created_at;
  const bDate = b.published_at ?? b.created_at;
  return new Date(aDate).getTime() - new Date(bDate).getTime();
});

console.log(`Backfilling ${sorted.length} fatwas...`);

for (let i = 0; i < sorted.length; i++) {
  const num = i + 1;
  const { error: updateErr } = await supabase
    .from('fatwas')
    .update({ fatwa_number: num })
    .eq('id', sorted[i].id);

  if (updateErr) {
    console.error(`Failed to update fatwa ${sorted[i].id}:`, updateErr.message);
  } else {
    console.log(`  #${num} → ${sorted[i].id}`);
  }
}

console.log('Done.');
