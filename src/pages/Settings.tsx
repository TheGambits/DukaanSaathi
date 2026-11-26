import { useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import type { AppDatabase, ShopProfile, VoiceLang } from '../types';

interface SettingsPageProps {
  db: AppDatabase;
  onBack: () => void;
  onSaveShop: (shop: ShopProfile) => void;
  onResetDemo: () => void;
}

export function SettingsPage({ db, onBack, onSaveShop, onResetDemo }: SettingsPageProps) {
  const [name, setName] = useState(db.shop.name);
  const [owner, setOwner] = useState(db.shop.owner);
  const [location, setLocation] = useState(db.shop.location);
  const [voiceLang, setVoiceLang] = useState<VoiceLang>(db.shop.voiceLang);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveShop({ name, owner, location, voiceLang });
    setSavedMsg('Shop settings save ho gayi.');
    setTimeout(() => setSavedMsg(null), 2500);
  };

  const handleResetConfirm = () => {
    onResetDemo();
    setConfirmReset(false);
    setName('Sharma General Store');
    setOwner('Rajesh Sharma');
    setLocation('Dadri, Uttar Pradesh');
    setVoiceLang('hi-IN');
    setSavedMsg('Demo data reset ho gaya!');
    setTimeout(() => setSavedMsg(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Home"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#12332F] lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#12332F]">Settings</h1>
          <p className="text-base text-[#546E7A]">Shop profile, voice language &amp; local data</p>
        </div>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-base font-bold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 text-sm shadow-sm"
        >
          <h2 className="text-lg font-extrabold text-[#12332F]">Shop Profile</h2>

          <div>
            <label className="font-bold text-[#12332F]">Shop Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 min-h-[46px] w-full rounded-xl border border-[#CFD8DC] px-3.5 text-base"
            />
          </div>

          <div>
            <label className="font-bold text-[#12332F]">Owner Name</label>
            <input
              type="text"
              required
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="mt-1 min-h-[46px] w-full rounded-xl border border-[#CFD8DC] px-3.5 text-base"
            />
          </div>

          <div>
            <label className="font-bold text-[#12332F]">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 min-h-[46px] w-full rounded-xl border border-[#CFD8DC] px-3.5 text-base"
            />
          </div>

          <div>
            <label className="font-bold text-[#12332F]">Default Voice Language</label>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value as VoiceLang)}
              className="mt-1 min-h-[46px] w-full rounded-xl border border-[#CFD8DC] bg-white px-3.5 text-base"
            >
              <option value="hi-IN">Hindi / Hinglish (hi-IN)</option>
              <option value="en-IN">Indian English (en-IN)</option>
            </select>
          </div>

          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-[#0F766E] text-base font-bold text-white hover:bg-[#12332F]"
          >
            Save Settings
          </button>
        </form>

        <div className="space-y-6">
          {/* Local Data Summary */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-base shadow-sm">
            <h2 className="text-lg font-extrabold text-[#12332F]">Local Data (Offline Storage)</h2>
            <p className="mt-1 text-sm text-[#607D8B]">
              Sabhi records aapke browser mein locally stored hain — bina internet ke kaam karta hai.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-[#F7F8F5] p-3">
                <span className="text-[#607D8B]">Products:</span>{' '}
                <strong className="text-base text-[#12332F]">{db.products.length}</strong>
              </div>
              <div className="rounded-xl bg-[#F7F8F5] p-3">
                <span className="text-[#607D8B]">Customers:</span>{' '}
                <strong className="text-base text-[#12332F]">{db.customers.length}</strong>
              </div>
              <div className="rounded-xl bg-[#F7F8F5] p-3">
                <span className="text-[#607D8B]">Bills:</span>{' '}
                <strong className="text-base text-[#12332F]">{db.bills.length}</strong>
              </div>
              <div className="rounded-xl bg-[#F7F8F5] p-3">
                <span className="text-[#607D8B]">Payments:</span>{' '}
                <strong className="text-base text-[#12332F]">{db.payments.length}</strong>
              </div>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6">
            <h2 className="text-lg font-extrabold text-[#DC2626]">Reset Demo Data</h2>
            <p className="mt-1 text-sm text-red-900">
              Isse sabhi bills, payments aur custom changes hat kar initial Sharma General Store
              demo data restore ho jayega.
            </p>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white text-base font-bold text-[#DC2626]"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Demo Data
              </button>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[48px] rounded-xl border border-[#CFD8DC] bg-white text-base font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetConfirm}
                  className="min-h-[48px] rounded-xl bg-[#DC2626] text-base font-bold text-white"
                >
                  Confirm Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
