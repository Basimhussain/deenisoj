import { createClient } from '@/lib/supabase-server';

export interface Profile {
  id: string;
  email: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (data as Profile) ?? null;
}

export async function requireAdmin(): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') return null;
  return profile;
}
