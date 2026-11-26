import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

interface SignupPageProps {
  onGoToLogin: () => void;
  onSignupAuthenticated: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupPage({ onGoToLogin, onSignupAuthenticated }: SignupPageProps) {
  const { signUp, isConfigured } = useAuth();
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSentTo, setVerificationSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ownerName.trim() || !shopName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Sabhi required fields bharna zaroori hai.');
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Kripya ek valid email address darj karein.');
      return;
    }

    if (password.length < 6) {
      setError('Password kam se kam 6 characters ka hona chahiye.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password aur Confirm Password match nahi kar rahe.');
      return;
    }

    setSubmitting(true);
    try {
      const outcome = await signUp({
        ownerName,
        shopName,
        email,
        password,
      });

      if (outcome.requiresEmailVerification) {
        setVerificationSentTo(email.trim());
      } else {
        onSignupAuthenticated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account create nahi ho saka.');
    } finally {
      setSubmitting(false);
    }
  };

  if (verificationSentTo) {
    return (
      <AuthLayout>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0F766E]/10 text-[#0F766E]">
            <MailCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#12332F]">Verify Your Email</h2>
          <p className="text-base text-[#546E7A]">
            Humne <strong>{verificationSentTo}</strong> par ek verification link bheja hai. Kripya
            apna inbox (aur spam folder) check karke email verify karein, uske baad Login karein.
          </p>
          <div className="rounded-xl bg-[#F7F8F5] p-3 text-xs text-[#607D8B]">
            <CheckCircle2 className="mr-1 inline h-4 w-4 text-[#0F766E]" />
            Account metadata ({ownerName.trim()} — {shopName.trim()}) save ho gaya hai.
          </div>
          <button
            type="button"
            onClick={onGoToLogin}
            className="min-h-[48px] w-full rounded-xl bg-[#0F766E] px-5 text-base font-bold text-white hover:bg-[#12332F]"
          >
            Go to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onGoToLogin}
          aria-label="Back to login"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F8F5] text-[#12332F] hover:bg-[#ECEFF1]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-[#12332F]">Create Account</h2>
          <p className="text-sm text-[#546E7A]">Apni dukaan ka naya account banayein.</p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-[#DC2626]"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-owner" className="block text-sm font-bold text-[#263238]">
              Owner Name *
            </label>
            <input
              id="signup-owner"
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Rajesh Sharma"
              className="mt-1 min-h-[46px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-3.5 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="signup-shop" className="block text-sm font-bold text-[#263238]">
              Shop Name *
            </label>
            <input
              id="signup-shop"
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Sharma General Store"
              className="mt-1 min-h-[46px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-3.5 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-bold text-[#263238]">
            Email *
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@shop.in"
            className="mt-1 min-h-[46px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-3.5 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-bold text-[#263238]">
            Password * (min 6 chars)
          </label>
          <div className="relative mt-1">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="min-h-[46px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] pl-3.5 pr-12 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
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
          <label htmlFor="signup-confirm" className="block text-sm font-bold text-[#263238]">
            Confirm Password *
          </label>
          <input
            id="signup-confirm"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="mt-1 min-h-[46px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-3.5 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !isConfigured}
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 text-base font-bold text-white transition-colors hover:bg-[#12332F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="mt-5 border-t border-[#E5E7EB] pt-4 text-center text-sm text-[#546E7A]">
        Pehle se account hai?{' '}
        <button
          type="button"
          onClick={onGoToLogin}
          className="font-extrabold text-[#0F766E] hover:underline"
        >
          Login karein
        </button>
      </div>
    </AuthLayout>
  );
}
