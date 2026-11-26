import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingVars: string[];
  errorMessage: string | null;
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const rawPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

export function validateSupabaseConfig(url: string, publishableKey: string): SupabaseConfigStatus {
  const missingVars: string[] = [];
  if (!url) missingVars.push('VITE_SUPABASE_URL');
  if (!publishableKey) missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');

  if (missingVars.length > 0) {
    return {
      isConfigured: false,
      missingVars,
      errorMessage: `Supabase configuration missing (${missingVars.join(', ')}). Create .env.local using .env.example and see docs/SUPABASE_SETUP.md.`,
    };
  }

  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(url);
  } catch {
    parsedUrl = null;
  }

  if (!parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      isConfigured: false,
      missingVars: [],
      errorMessage:
        'VITE_SUPABASE_URL is invalid. Expected a valid https://<project-ref>.supabase.co URL.',
    };
  }

  if (
    url.includes('your-project-ref') ||
    publishableKey.includes('your_publishable_key')
  ) {
    return {
      isConfigured: false,
      missingVars: [],
      errorMessage:
        'Placeholder Supabase credentials detected in .env.local. Replace them with your real Project URL and Publishable Key.',
    };
  }

  // Never allow secret or service_role keys in client code
  if (publishableKey.startsWith('sb_secret_') || publishableKey.includes('service_role')) {
    return {
      isConfigured: false,
      missingVars: [],
      errorMessage:
        'Unsafe key detected in VITE_SUPABASE_PUBLISHABLE_KEY. Only use a Supabase publishable or anon key in the browser.',
    };
  }

  return {
    isConfigured: true,
    missingVars: [],
    errorMessage: null,
  };
}

export const supabaseConfigStatus = validateSupabaseConfig(rawUrl, rawPublishableKey);

export const supabase: SupabaseClient | null = supabaseConfigStatus.isConfigured
  ? createClient(rawUrl, rawPublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      supabaseConfigStatus.errorMessage ??
        'Supabase is not configured. Check .env.local and docs/SUPABASE_SETUP.md.'
    );
  }
  return supabase;
}
