import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, supabase, supabaseConfigStatus } from '../lib/supabase';

const EPHEMERAL_FLAG_KEY = 'dukaan_saathi_ephemeral_session';
const TAB_ACTIVE_KEY = 'dukaan_saathi_tab_active';

export interface SignUpInput {
  ownerName: string;
  shopName: string;
  email: string;
  password: string;
}

export interface SignUpOutcome {
  requiresEmailVerification: boolean;
  user: User | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  configError: string | null;
  isRecoveryMode: boolean;
  signIn: (email: string, password: string, rememberSession: boolean) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<SignUpOutcome>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearRecoveryMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatAuthError(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Authentication failed. Please try again.';

  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Kripya sahi details darj karein.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email abhi verify nahi hua hai. Apne inbox mein verification link check karein.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Is email se account pehle se bana hua hai. Kripya Login karein.';
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed')
  ) {
    return 'Network error: Internet connection ya Supabase server reachable nahi hai. Kripya connection check karein.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Bahut zyada attempts ho gaye. Thodi der baad dobara koshish karein.';
  }

  return message;
}

function hasRecoveryParamsInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    hash.includes('type=recovery') ||
    search.includes('type=recovery') ||
    window.location.pathname === '/reset-password'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(supabaseConfigStatus.isConfigured);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() => hasRecoveryParamsInUrl());

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const client = supabase;

    const initAuth = async () => {
      try {
        // If previous login opted out of "Remember session" and this is a fresh browser tab session, sign out cleanly
        const wasEphemeral = window.localStorage.getItem(EPHEMERAL_FLAG_KEY) === 'true';
        const tabActive = window.sessionStorage.getItem(TAB_ACTIVE_KEY) === 'true';

        if (wasEphemeral && !tabActive) {
          await client.auth.signOut();
          window.localStorage.removeItem(EPHEMERAL_FLAG_KEY);
          if (mounted) {
            setSession(null);
            setUser(null);
          }
          return;
        }

        const { data, error } = await client.auth.getSession();
        if (error) {
          throw error;
        }
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session && wasEphemeral) {
            window.sessionStorage.setItem(TAB_ACTIVE_KEY, 'true');
          }
        }
      } catch {
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initAuth();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
      if (event === 'SIGNED_OUT') {
        setIsRecoveryMode(false);
        window.localStorage.removeItem(EPHEMERAL_FLAG_KEY);
        window.sessionStorage.removeItem(TAB_ACTIVE_KEY);
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, rememberSession: boolean) => {
    const client = getSupabaseClient();
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (rememberSession) {
        window.localStorage.removeItem(EPHEMERAL_FLAG_KEY);
        window.sessionStorage.removeItem(TAB_ACTIVE_KEY);
      } else {
        window.localStorage.setItem(EPHEMERAL_FLAG_KEY, 'true');
        window.sessionStorage.setItem(TAB_ACTIVE_KEY, 'true');
      }

      setSession(data.session);
      setUser(data.user);
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  const signUp = async (input: SignUpInput): Promise<SignUpOutcome> => {
    const client = getSupabaseClient();
    try {
      const { data, error } = await client.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            owner_name: input.ownerName.trim(),
            shop_name: input.shopName.trim(),
          },
        },
      });
      if (error) throw error;

      const requiresEmailVerification = !data.session;
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }

      return {
        requiresEmailVerification,
        user: data.user,
      };
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch (err) {
      throw new Error(formatAuthError(err));
    } finally {
      window.localStorage.removeItem(EPHEMERAL_FLAG_KEY);
      window.sessionStorage.removeItem(TAB_ACTIVE_KEY);
      setIsRecoveryMode(false);
      setSession(null);
      setUser(null);
    }
  };

  const sendPasswordReset = async (email: string) => {
    const client = getSupabaseClient();
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  const updatePassword = async (newPassword: string) => {
    const client = getSupabaseClient();
    try {
      const { data, error } = await client.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  const clearRecoveryMode = () => {
    setIsRecoveryMode(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: supabaseConfigStatus.isConfigured,
        configError: supabaseConfigStatus.errorMessage,
        isRecoveryMode,
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        updatePassword,
        clearRecoveryMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
