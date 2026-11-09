import React, { useState } from 'react';
import {
  X,
  Flame,
  Plus,
  Mail,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Channel, KeywordRule } from '../types.ts';
import { splitKeywords } from '../utils/telegramMatcher.ts';
import { translations, Language } from '../utils/i18n.ts';

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onCreateRule: (rule: Omit<KeywordRule, 'id'>) => Promise<void>;
  defaultEmail: string;
  defaultPhone: string;
  language: Language;
}

export const CreateRuleModal: React.FC<CreateRuleModalProps> = ({
  isOpen,
  onClose,
  channels,
  onCreateRule,
  defaultEmail,
  defaultPhone,
  language,
}) => {
  const t = translations[language];

  const [name, setName] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [excludedInput, setExcludedInput] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [allChannels, setAllChannels] = useState(true);
  const [priority, setPriority] = useState<KeywordRule['priority']>('high');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = splitKeywords(keywordsInput);

    if (!name.trim()) {
      setError(language === 'fa' ? 'لطفاً یک نام برای این قانون وارد کنید' : 'Please provide a name for this rule');
      return;
    }

    if (keywords.length === 0) {
      setError(language === 'fa' ? 'لطفاً حداقل یک کلیدواژه وارد کنید' : 'Please provide at least one keyword to track');
      return;
    }

    const excludedKeywords = splitKeywords(excludedInput);

    setLoading(true);
    setError(null);
    try {
      await onCreateRule({
        name: name.trim(),
        channelIds: allChannels ? [] : selectedChannels,
        keywords,
        excludedKeywords,
        caseSensitive,
        wholeWord,
        isRegex,
        priority,
        notifyEmail,
        notifyWhatsApp,
        notifyInApp,
        enabled: true,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || (language === 'fa' ? 'ثبت قانون انجام نشد' : 'Failed to save rule'));
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (id: string) => {
    if (selectedChannels.includes(id)) {
      setSelectedChannels(selectedChannels.filter(c => c !== id));
    } else {
      setSelectedChannels([...selectedChannels, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">{t.createRuleTitle}</h3>
              <p className="text-xs text-slate-400">{t.createRuleDesc}</p>
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
          {error && (
            <div className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 p-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Rule Name */}
          <div>
            <label htmlFor="createRuleNameInput" className="block text-xs font-semibold text-slate-300 mb-1">
              {t.ruleNameLabel}
            </label>
            <input
              id="createRuleNameInput"
              type="text"
              required
              placeholder={t.ruleNamePlaceholder}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Keywords to Track */}
          <div>
            <label htmlFor="createRuleKeywordsInput" className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>{t.keywordsLabel}</span>
              <span className="text-[10px] text-sky-400 font-normal">{t.keywordsHelp}</span>
            </label>
            <input
              id="createRuleKeywordsInput"
              type="text"
              required
              placeholder={t.keywordsPlaceholder}
              value={keywordsInput}
              onChange={e => setKeywordsInput(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Excluded Negative Keywords */}
          <div>
            <label htmlFor="createRuleExcludeInput" className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-rose-400/90">
                <ShieldAlert className="w-3.5 h-3.5" />
                {t.excludeLabel}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">{t.excludeHelp}</span>
            </label>
            <input
              id="createRuleExcludeInput"
              type="text"
              placeholder={t.excludePlaceholder}
              value={excludedInput}
              onChange={e => setExcludedInput(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Target Channels */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.targetChannelsLabel}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allChannels}
                  onChange={e => {
                    setAllChannels(e.target.checked);
                    if (e.target.checked) setSelectedChannels([]);
                  }}
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                <span className="font-semibold">{t.trackAllChannels} ({channels.length})</span>
              </label>

              {!allChannels && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {channels.map(c => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-xs text-slate-300 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(c.id)}
                        onChange={() => toggleChannel(c.id)}
                        className="w-3.5 h-3.5 accent-sky-500 rounded"
                      />
                      <span className="truncate">{c.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Priority & Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="createRulePrioritySelect" className="block text-xs font-semibold text-slate-300 mb-1">
                {t.priorityLabel}
              </label>
              <select
                id="createRulePrioritySelect"
                value={priority}
                onChange={e => setPriority(e.target.value as KeywordRule['priority'])}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="critical">{t.critical}</option>
                <option value="high">{t.high}</option>
                <option value="medium">{t.medium}</option>
                <option value="low">{t.low}</option>
              </select>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="block text-xs font-semibold text-slate-300">{t.matchingMode}</span>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={e => setCaseSensitive(e.target.checked)}
                    className="w-3.5 h-3.5 accent-sky-500 rounded"
                  />
                  <span>{t.caseSensitive}</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wholeWord}
                    onChange={e => setWholeWord(e.target.checked)}
                    className="w-3.5 h-3.5 accent-sky-500 rounded"
                  />
                  <span>{t.wholeWord}</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRegex}
                    onChange={e => setIsRegex(e.target.checked)}
                    className="w-3.5 h-3.5 accent-sky-500 rounded"
                  />
                  <span>{t.regexPattern}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Immediate Dispatch Targets */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="block text-xs font-semibold text-slate-300">
              {t.notificationDestinations}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                <Mail className="w-4 h-4 text-sky-400" />
                <div className="min-w-0">
                  <div className="font-semibold text-white">{t.emailAlert}</div>
                  <div className="text-[10px] text-slate-400 truncate">{defaultEmail}</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  onChange={e => setNotifyWhatsApp(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <div className="min-w-0">
                  <div className="font-semibold text-white">{t.whatsAppAlert}</div>
                  <div className="text-[10px] text-slate-400 truncate">{defaultPhone || '1-Click wa.me'}</div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={loading || !name.trim() || !keywordsInput.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? t.creating : t.newRule}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
