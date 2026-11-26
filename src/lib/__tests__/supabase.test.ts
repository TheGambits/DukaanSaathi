import { describe, expect, it } from 'vitest';
import { validateSupabaseConfig } from '../supabase';

describe('Supabase config validation', () => {
  it('returns clear error when credentials are missing', () => {
    const res = validateSupabaseConfig('', '');
    expect(res.isConfigured).toBe(false);
    expect(res.missingVars).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']);
    expect(res.errorMessage).toContain('VITE_SUPABASE_URL');
    expect(res.errorMessage).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
  });

  it('rejects invalid URLs', () => {
    const res = validateSupabaseConfig('not-a-url', 'sb_publishable_example_key');
    expect(res.isConfigured).toBe(false);
    expect(res.errorMessage).toContain('VITE_SUPABASE_URL is invalid');
  });

  it('rejects unedited placeholder values', () => {
    const res = validateSupabaseConfig(
      'https://your-project-ref.supabase.co',
      'sb_publishable_your_publishable_key_here'
    );
    expect(res.isConfigured).toBe(false);
    expect(res.errorMessage).toContain('Placeholder Supabase credentials');
  });

  it('rejects secret/service_role keys in frontend env', () => {
    const res = validateSupabaseConfig(
      'https://example.supabase.co',
      'sb_secret_never_use_in_browser'
    );
    expect(res.isConfigured).toBe(false);
    expect(res.errorMessage).toContain('Unsafe key');
  });

  it('accepts valid project URL and publishable key', () => {
    const res = validateSupabaseConfig(
      'https://demo-project.supabase.co',
      'sb_publishable_demo1234567890'
    );
    expect(res.isConfigured).toBe(true);
    expect(res.missingVars).toEqual([]);
    expect(res.errorMessage).toBeNull();
  });
});
