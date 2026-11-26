import type { ReactNode } from 'react';
import { AlertTriangle, IndianRupee, Mic, Package, ShieldCheck, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthLayout({ children }: { children: ReactNode }) {
  const { isConfigured, configError } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F8F5] lg:grid lg:grid-cols-2">
      {/* LEFT SIDE — Branding & Shop Illustration (Desktop) */}
      <div className="hidden flex-col justify-between bg-[#12332F] p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F59E0B] text-[#12332F]">
              <Store className="h-7 w-7" strokeWidth={2.3} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide">DUKAAN SAATHI</h1>
              <p className="text-sm text-emerald-100/80">Ab dukaan ka hisaab, sirf bolkar.</p>
            </div>
          </div>

          <div className="mt-14 max-w-lg space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight">
              Aapki Dukaan ka Smart Digital Munim.
            </h2>
            <p className="text-base leading-relaxed text-emerald-100/85">
              Bina complicated computer software ke — Hindi aur Hinglish mein bolkar bill
              banayein, stock track karein, aur grahakon ka Udhaar hisaab sambhalein.
            </p>
          </div>
        </div>

        <div className="my-8 max-w-lg rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <Mic className="h-6 w-6 text-[#F59E0B]" />
              <p className="mt-3 text-sm font-bold">Bolkar Bill</p>
              <p className="mt-0.5 text-xs text-emerald-100/75">Hindi &amp; Hinglish</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <Package className="h-6 w-6 text-[#F59E0B]" />
              <p className="mt-3 text-sm font-bold">Auto Stock</p>
              <p className="mt-0.5 text-xs text-emerald-100/75">Low-stock alert</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <IndianRupee className="h-6 w-6 text-[#F59E0B]" />
              <p className="mt-3 text-sm font-bold">Udhaar Khata</p>
              <p className="mt-0.5 text-xs text-emerald-100/75">WhatsApp reminder</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-emerald-100/75">
          <ShieldCheck className="h-4 w-4 text-[#F59E0B]" />
          <span>Secured by Supabase Auth • Local shop data stays on this device</span>
        </div>
      </div>

      {/* RIGHT SIDE — Auth Card */}
      <div className="flex min-h-screen items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          {/* Mobile Brand Header */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#12332F] text-[#F59E0B]">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-[#12332F]">DUKAAN SAATHI</p>
              <p className="text-xs text-[#607D8B]">Ab dukaan ka hisaab, sirf bolkar.</p>
            </div>
          </div>

          {!isConfigured && configError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-950"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]" />
              <div>
                <p className="font-extrabold">Supabase Setup Required</p>
                <p className="mt-0.5 text-xs leading-relaxed">{configError}</p>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
