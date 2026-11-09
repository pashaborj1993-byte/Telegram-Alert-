import React, { useState } from 'react';
import {
  X,
  Radio,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { normalizeChannelUsername } from '../utils/telegramMatcher.ts';
import { translations, Language } from '../utils/i18n.ts';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (username: string) => Promise<void>;
  language: Language;
}

const PRESET_CHANNELS = [
  { username: 'https://t.me/mizanplus', title: 'خبرگزاری میزان (قوه قضائیه) - https://t.me/mizanplus' },
  { username: 'https://t.me/FarsNA', title: 'خبرگزاری فارس - https://t.me/FarsNA' },
  { username: 'https://t.me/iribnews', title: 'خبرگزاری صداوسیما - https://t.me/iribnews' },
  { username: 'mizanplus', title: '@mizanplus (میزان)' },
  { username: 'FarsNA', title: '@FarsNA (فارس)' },
  { username: 'iribnews', title: '@iribnews (صدا و سیما)' },
];

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  onAddChannel,
  language,
}) => {
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeChannelUsername(input);
    if (!clean) {
      setError(language === 'fa' ? 'لطفاً یک شناسه یا پیوند معتبر تلگرام وارد کنید' : 'Please enter a valid channel handle or t.me link');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onAddChannel(clean);
      setInput('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || (language === 'fa' ? 'افزودن کانال انجام نشد' : 'Failed to add channel'));
    } finally {
      setLoading(false);
    }
  };

  const handlePickPopular = (username: string) => {
    setInput(username);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">{t.addChannelTitle}</h3>
              <p className="text-xs text-slate-400">{t.addChannelDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label htmlFor="channelHandleOrIdInput" className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.channelInputLabel}
            </label>
            <div className="relative">
              <input
                id="channelHandleOrIdInput"
                type="text"
                required
                autoFocus
                placeholder={t.channelInputPlaceholder}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {t.channelInputHelp}
            </p>
          </div>

          {error && (
            <div className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 p-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {t.popularChannels}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_CHANNELS.map(p => (
                <button
                  key={p.username}
                  type="button"
                  onClick={() => handlePickPopular(p.username)}
                  className="text-right sm:text-left p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 transition-colors group flex flex-col justify-between"
                >
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-sky-400 truncate">
                    {p.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                    {p.username.length > 30 ? p.username.slice(0, 30) + '...' : p.username}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? t.validatingChannel : t.addChannel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
