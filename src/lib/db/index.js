// Picks where data is stored.
//  - Supabase (cloud) when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env
//  - Local (this browser only) otherwise
// Both backends expose the same functions, so the rest of the app does not care.
import { createLocalBackend } from './local';
import { createSupabaseBackend } from './supabase';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const db = url && key ? createSupabaseBackend(url, key) : createLocalBackend();
export const isLocalMode = db.mode === 'local';
