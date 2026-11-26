import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Send, AlertCircle, Globe } from 'lucide-react';
import type { VoiceLang } from '../types';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

interface VoiceInputProps {
  voiceLang: VoiceLang;
  onChangeVoiceLang: (lang: VoiceLang) => void;
  onSubmitText: (text: string) => void;
}

const SAMPLE_PROMPTS = [
  '2 kilo chawal aur 1 tel, Ramesh ko udhaar',
  'aadha kilo cheeni cash',
  'teen packet Maggi UPI',
  'Ramesh se 500 rupaye mile',
];

export function VoiceInput({
  voiceLang,
  onChangeVoiceLang,
  onSubmitText,
}: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const speechSupported = Boolean(getSpeechRecognitionCtor());

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop error
      }
    }
    setIsListening(false);
  };

  const startListening = () => {
    setVoiceError(null);
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceError(
        'Is browser mein voice recognition supported nahi hai. Neeche type karke bill banayein.'
      );
      return;
    }

    try {
      const recognition = new Ctor();
      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      setLiveTranscript('');

      recognition.onresult = (event) => {
        let combined = '';
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          combined += result[0]?.transcript ?? '';
          if (result.isFinal) hasFinal = true;
        }
        const cleaned = combined.trim();
        setLiveTranscript(cleaned);
        setText(cleaned);

        if (hasFinal && cleaned) {
          setIsListening(false);
          onSubmitText(cleaned);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError(
            'Mic permission denied. Browser settings se microphone allow karein ya neeche type karein.'
          );
        } else if (event.error === 'no-speech') {
          setVoiceError('Koi awaaz sunai nahi di. Dobara mic dabayein ya type karein.');
        } else if (event.error === 'audio-capture') {
          setVoiceError('Microphone device nahi mila. Neeche type karke bill banayein.');
        } else if (event.error === 'network') {
          setVoiceError(
            'Browser speech service offline hai. Text box hamesha bina internet ke kaam karta hai!'
          );
        } else {
          setVoiceError(`Voice error (${event.error}). Kripya text box se entry karein.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError('Microphone start nahi ho saka. Kripya neeche type karein.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = text.trim();
    if (!cleaned) {
      setVoiceError('Kripya pehle bolen ya transaction type karein.');
      return;
    }
    setVoiceError(null);
    onSubmitText(cleaned);
  };

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      {/* Header + Language Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F3F5] pb-4">
        <div>
          <h2 className="text-lg font-extrabold tracking-wide text-[#12332F] sm:text-xl">
            BOLKAR BILL BANAYEIN
          </h2>
          <p className="text-sm text-[#546E7A] sm:text-base">
            Apni transaction boliye aur bill turant banaiye.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="hidden h-4 w-4 text-[#0F766E] sm:block" />
          <div className="inline-flex rounded-xl bg-[#F7F8F5] p-1">
            <button
              type="button"
              onClick={() => onChangeVoiceLang('hi-IN')}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                voiceLang === 'hi-IN'
                  ? 'bg-[#0F766E] text-white'
                  : 'text-[#455A64] hover:text-[#263238]'
              }`}
            >
              हिंदी (hi-IN)
            </button>
            <button
              type="button"
              onClick={() => onChangeVoiceLang('en-IN')}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                voiceLang === 'en-IN'
                  ? 'bg-[#0F766E] text-white'
                  : 'text-[#455A64] hover:text-[#263238]'
              }`}
            >
              English (en-IN)
            </button>
          </div>
        </div>
      </div>

      {/* Main Microphone + Input Layout */}
      <div className="mt-5 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
        {/* Large Turmeric-Yellow Microphone Button */}
        <div className="flex flex-col items-center justify-center text-center lg:col-span-4 lg:border-r lg:border-[#F1F3F5] lg:pr-6">
          {!isListening ? (
            <button
              type="button"
              onClick={startListening}
              aria-label="Bolkar Bill Banayein"
              className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F59E0B] text-[#12332F] shadow-md transition-transform hover:bg-[#F59E0B]/90 active:scale-95"
            >
              <Mic className="h-11 w-11" strokeWidth={2.3} />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={stopListening}
                aria-label="Stop Listening"
                className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-[#DC2626] text-white shadow-md active:scale-95"
              >
                <Square className="h-9 w-9 fill-current" />
              </button>
              <button
                type="button"
                onClick={stopListening}
                className="rounded-full bg-red-100 px-4 py-1.5 text-sm font-bold text-[#DC2626]"
              >
                Sun raha hai... Stop Listening
              </button>
            </div>
          )}

          <p className="mt-3 text-sm font-bold text-[#12332F]">
            {isListening ? 'Abhi boliye...' : 'Mic dabakar bolein'}
          </p>

          {!speechSupported && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
              Voice API is browser mein unavailable hai — text box hamesha kaam karta hai.
            </p>
          )}
        </div>

        {/* Text Transaction Input + Quick Examples */}
        <div className="space-y-3 lg:col-span-8">
          <label
            htmlFor="home-transaction-input"
            className="block text-base font-bold text-[#263238]"
          >
            Ya transaction type karein
          </label>

          {(isListening || liveTranscript) && (
            <div className="rounded-xl border border-[#0F766E]/25 bg-[#0F766E]/5 px-3.5 py-2.5 text-sm">
              <span className="font-bold text-[#0F766E]">Transcript: </span>
              <span className="text-[#263238]">
                {liveTranscript || 'Boliye, jaise "2 kilo chawal aur 1 tel, Ramesh ko udhaar"...'}
              </span>
            </div>
          )}

          {voiceError && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
              <span>{voiceError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-2.5 sm:flex-row">
            <input
              id="home-transaction-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Jaise: "2 kilo chawal aur 1 tel, Ramesh ko udhaar"'
              className="min-h-[52px] w-full flex-1 rounded-xl border border-[#CFD8DC] bg-[#F7F8F5] px-4 py-3 text-base text-[#263238] placeholder:text-[#78909C] focus:border-[#0F766E] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#12332F] active:scale-[0.99]"
            >
              <Send className="h-5 w-5" />
              <span>Bill Banayein</span>
            </button>
          </form>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#607D8B]">
              Quick Try Examples:
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setText(sample);
                    setVoiceError(null);
                  }}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F7F8F5] px-3 py-1.5 text-left text-sm font-medium text-[#12332F] transition-colors hover:border-[#0F766E] hover:bg-[#0F766E]/5"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
