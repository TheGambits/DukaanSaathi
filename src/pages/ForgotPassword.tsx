import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

interface ForgotPasswordPageProps {
  onGoToLogin: () => void;
}

export function ForgotPasswordPage({ onGoToLogin }: ForgotPasswordPageProps) {
  const { sendPasswordReset, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentTo(null);

    if (!email.trim()) {
      setError('Kripya apna registered email darj karein.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery email nahi bheja ja saka.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-extrabold text-[#12332F]">Forgot Password</h2>
          <p className="text-sm text-[#546E7A]">Apne email par password reset link mangwayein.</p>
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

      {sentTo ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-[#12332F]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0F766E]" />
            <div>
              <p className="font-extrabold">Recovery Email Sent!</p>
              <p className="mt-1">
                Humne <strong>{sentTo}</strong> par password reset link bheja hai. Email mein diye
                link par click karke naya password set karein.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToLogin}
            className="min-h-[48px] w-full rounded-xl bg-[#0F766E] px-5 text-base font-bold text-white hover:bg-[#12332F]"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-bold text-[#263238]">
              Registered Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rajesh@sharmastore.in"
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-4 text-base focus:border-[#0F766E] focus:bg-white focus:outline-none"
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
                <span>Sending Recovery Link...</span>
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                <span>Send Recovery Email</span>
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
