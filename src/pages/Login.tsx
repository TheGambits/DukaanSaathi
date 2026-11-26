import { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onGoToSignup: () => void;
  onGoToForgotPassword: () => void;
  onLoginSuccess: () => void;
}

export function LoginPage({
  onGoToSignup,
  onGoToForgotPassword,
  onLoginSuccess,
}: LoginPageProps) {
  const { signIn, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError('Kripya email aur password dono darj karein.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password, rememberSession);
      setSuccessMsg('Login safal! Aapka dashboard khul raha hai...');
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login nahi ho saka.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-extrabold text-[#12332F]">Welcome Back</h2>
        <p className="mt-1 text-base text-[#546E7A]">
          Apni dukaan ka hisaab kholne ke liye login karein.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-[#DC2626]"
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-[#0F766E]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-bold text-[#263238]">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rajesh@sharmastore.in"
            className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-4 text-base text-[#263238] focus:border-[#0F766E] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-bold text-[#263238]">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="min-h-[48px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] pl-4 pr-12 text-base text-[#263238] focus:border-[#0F766E] focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#607D8B] hover:bg-[#ECEFF1]"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-[#263238]">
            <input
              type="checkbox"
              checked={rememberSession}
              onChange={(e) => setRememberSession(e.target.checked)}
              className="h-4 w-4 rounded border-[#CFD8DC] text-[#0F766E] focus:ring-[#0F766E]"
            />
            <span>Remember session</span>
          </label>

          <button
            type="button"
            onClick={onGoToForgotPassword}
            className="font-bold text-[#0F766E] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting || !isConfigured}
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 text-base font-bold text-white transition-colors hover:bg-[#12332F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <span>Login</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-[#E5E7EB] pt-5 text-center text-sm text-[#546E7A]">
        Naye dukaan owner hain?{' '}
        <button
          type="button"
          onClick={onGoToSignup}
          className="font-extrabold text-[#0F766E] hover:underline"
        >
          Create account
        </button>
      </div>
    </AuthLayout>
  );
}
