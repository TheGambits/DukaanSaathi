import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

interface ResetPasswordPageProps {
  onResetComplete: () => void;
  onGoToLogin: () => void;
}

export function ResetPasswordPage({ onResetComplete, onGoToLogin }: ResetPasswordPageProps) {
  const { updatePassword, session, loading, isConfigured } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Naya password kam se kam 6 characters ka hona chahiye.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password aur Confirm Password match nahi kar rahe.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setUpdated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password update nahi ho saka.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-extrabold text-[#12332F]">Set New Password</h2>
        <p className="mt-1 text-base text-[#546E7A]">
          Apne Dukaan Saathi account ke liye naya password darj karein.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-8 text-[#546E7A]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
          <p className="mt-2 text-sm font-semibold">Recovery link verify ho raha hai...</p>
        </div>
      ) : updated ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-[#12332F]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0F766E]" />
            <div>
              <p className="font-extrabold">Password Updated!</p>
              <p className="mt-1">Aapka naya password save ho gaya hai.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetComplete}
            className="min-h-[48px] w-full rounded-xl bg-[#0F766E] px-5 text-base font-bold text-white hover:bg-[#12332F]"
          >
            Continue to Dashboard
          </button>
        </div>
      ) : !session ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-extrabold">Invalid or Expired Recovery Session</p>
            <p className="mt-1">
              Password reset karne ke liye email mein aaye latest recovery link par click karein, ya
              dobara Forgot Password request bhejein.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToLogin}
            className="min-h-[48px] w-full rounded-xl bg-[#0F766E] px-5 text-base font-bold text-white"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-[#DC2626]"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reset-password" className="block text-sm font-bold text-[#263238]">
              New Password * (min 6 chars)
            </label>
            <div className="relative mt-1.5">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="min-h-[48px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] pl-4 pr-12 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#607D8B]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-bold text-[#263238]">
              Confirm New Password *
            </label>
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-4 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !isConfigured}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 text-base font-bold text-white hover:bg-[#12332F] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <KeyRound className="h-5 w-5" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
