import { supabase } from './supabase';

// ─── Cross-Device User Settings (Supabase key-value store) ─────────────────────
// Provides get/set for per-user preferences that sync across all devices.
// Falls back to localStorage if user is not authenticated.

const LS_PREFIX = 'bv_';

export async function getUserSetting<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Fallback: localStorage
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw ? JSON.parse(raw) : defaultValue;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', user.id)
      .eq('key', key)
      .single();

    if (error || !data) {
      // Try localStorage as fallback
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw ? JSON.parse(raw) : defaultValue;
    }

    return data.value as T;
  } catch {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

export async function setUserSetting(key: string, value: any): Promise<void> {
  // Always write to localStorage for instant UX
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {}

  // Then write to Supabase for cross-device sync
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_settings').upsert(
      { user_id: user.id, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    );
  } catch {
    // Supabase write fails silently — localStorage still works
  }
}

export async function deleteUserSetting(key: string): Promise<void> {
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {}

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_settings').delete().eq('user_id', user.id).eq('key', key);
  } catch {}
}
