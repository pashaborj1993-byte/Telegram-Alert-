import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Channel, AlertLog } from '../types.ts';
import { translations, Language } from '../utils/i18n.ts';

interface SimulatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onSimulate: (channelUsername: string, text: string) => Promise<{
    matchedRulesCount: number;
    alerts: AlertLog[];
  }>;
  language: Language;
}

export const SimulatePostModal: React.FC<SimulatePostModalProps> = ({
  isOpen,
  onClose,
  channels,
  onSimulate,
  language,
}) => {
  const t = translations[language];

  const PRESETS = [
    {
      label: '🚨 خبرگزاری میزان (قوه قضائیه): اجرای حکم اعدام و به دار مجازات آویختن',
      channel: 'mizanplus',
      text: 'سخنگوی قوه قضائیه: حکم اعدام محکومان پرونده تروریستی اخیر پس از طی مراحل قانونی و تایید در دیوان عالی کشور، صبح امروز به مرحله اجرا درآمد و متهم به دار مجازات آویخته شد.',
    },
    {
      label: '⚡ خبرگزاری فارس: مواضع سیاسی رضا پهلوی درباره اعدام‌ها',
      channel: 'FarsNA',
      text: 'واکنش رسانه‌ها به بیانیه اخیر رضا پهلوی درباره تحولات سیاسی ایران و تشدید کمپین‌های بین‌المللی پیرامون اعدام‌ها در کشور.',
    },
    {
      label: '⚡ خبرگزاری فارس: گزارش درباره مریم رجوی و گروهک منافقین',
      channel: 'FarsNA',
      text: 'گزارش اختصاصی فارس: ابعاد جدیدی از تحرکات مریم رجوی و سرکردگان گروهک منافقین در کشورهای اروپایی افشا شد.',
    },
    {
      label: '🚨 خبرگزاری صداوسیما: گزارش احکام قصاص و اعدام',
      channel: 'iribnews',
      text: 'بخش خبری صدا و سیما: بر اساس اطلاعیه رسمی دادستانی، بامداد امروز محکومان پرونده قتل عمد پس از عدم رضایت اولیای دم به دار مجازات آویخته شدند و حکم قصاص و اعدام اجرا شد.',
    },
    {
      label: '🛡️ متن بدون تطبیق یا دارای استثنا (تبلیغات عمومی)',
      channel: 'mizanplus',
      text: 'اطلاعیه اداری و تقویم آموزشی دوره‌های کارآموزی وکالت و حقوق در دانشگاه تهران.',
    },
  ];

  const [selectedChannel, setSelectedChannel] = useState<string>(channels[0]?.username || 'mizanplus');
  const [text, setText] = useState<string>(PRESETS[0].text);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    matchedRulesCount: number;
    alerts: AlertLog[];
  } | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setSelectedChannel(p.channel);
    setText(p.text);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await onSimulate(selectedChannel, text);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">{t.simulateModalTitle}</h3>
              <p className="text-xs text-slate-400">{t.simulateModalDesc}</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.quickPresets}
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-right sm:text-left text-xs p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300 hover:text-white transition-colors truncate"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Selection */}
          <div>
            <label htmlFor="simChannelSelect" className="block text-xs font-semibold text-slate-300 mb-1">
              {t.simChannel}
            </label>
            <select
              id="simChannelSelect"
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {channels.map(c => (
                <option key={c.id} value={c.username}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Message Text Input */}
          <div>
            <label htmlFor="simMessageTextarea" className="block text-xs font-semibold text-slate-300 mb-1">
              {t.messageContent}
            </label>
            <textarea
              id="simMessageTextarea"
              rows={3}
              required
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t.messagePlaceholder}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans text-right sm:text-inherit"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? t.evaluating : t.processPost}</span>
          </button>

          {/* Simulation Output Result */}
          {result && (
            <div className="pt-2 animate-in fade-in duration-200">
              {result.matchedRulesCount > 0 ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {t.matchSuccess} ({result.matchedRulesCount})
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {result.alerts.map(a => (
                      <div
                        key={a.id}
                        className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{a.ruleName}</div>
                          <div className="text-[11px] text-slate-400">
                            {t.triggeredBy} <span className="text-amber-300 font-bold">{a.matchedKeywords.join('، ')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            Email Sent
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            WA Ready
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{t.noMatch}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
