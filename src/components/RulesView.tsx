import React from 'react';
import {
  Flame,
  Plus,
  Mail,
  MessageSquare,
  Bell,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { KeywordRule, Channel } from '../types.ts';
import { translations, Language } from '../utils/i18n.ts';

interface RulesViewProps {
  rules: KeywordRule[];
  channels: Channel[];
  onCreateRule: () => void;
  onToggleRule: (id: string, enabled: boolean) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  language: Language;
}

export const RulesView: React.FC<RulesViewProps> = ({
  rules,
  channels,
  onCreateRule,
  onToggleRule,
  onDeleteRule,
  language,
}) => {
  const t = translations[language];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{t.keywordRulesTitle}</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {rules.length} {t.rulesCount}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.rulesDesc}
          </p>
        </div>

        <button
          onClick={onCreateRule}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newRule}</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <Flame className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">{t.noRulesYet}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t.noRulesDesc}
            </p>
            <button
              onClick={onCreateRule}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.newRule}
            </button>
          </div>
        ) : (
          rules.map(rule => {
            const assignedChannels = rule.channelIds && rule.channelIds.length > 0
              ? channels.filter(c => rule.channelIds.includes(c.id))
              : [];

            return (
              <div
                key={rule.id}
                className={`bg-slate-900/70 border rounded-2xl p-4 sm:p-5 transition-all ${
                  rule.enabled
                    ? 'border-slate-800 hover:border-slate-700 shadow-md shadow-slate-950/40'
                    : 'border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-white">{rule.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          rule.priority === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : rule.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {rule.priority === 'critical' ? (language === 'fa' ? 'بحرانی' : 'Critical') : rule.priority}
                      </span>
                      {rule.caseSensitive && (
                        <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                          {t.caseSensitive}
                        </span>
                      )}
                      {rule.isRegex && (
                        <span className="text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          {t.regexPattern}
                        </span>
                      )}
                    </div>

                    {/* Target Channels */}
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-500">{t.tabChannels}:</span>
                      {assignedChannels.length === 0 ? (
                        <span className="text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded text-[11px] font-medium border border-sky-500/20">
                          {t.allChannels} ({channels.length})
                        </span>
                      ) : (
                        assignedChannels.map(c => (
                          <span
                            key={c.id}
                            className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium"
                          >
                            {c.title}
                          </span>
                        ))
                      )}
                    </div>

                    {/* Keywords Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-xs font-medium text-slate-500 mr-1">{t.matches}</span>
                      {rule.keywords.map(kw => (
                        <span
                          key={kw}
                          className="bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-lg"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>

                    {/* Negative / Excluded Keywords */}
                    {rule.excludedKeywords && rule.excludedKeywords.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-xs font-medium text-rose-500/80 mr-1 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {t.excludes}
                        </span>
                        {rule.excludedKeywords.map(ex => (
                          <span
                            key={ex}
                            className="bg-rose-500/10 text-rose-400/90 border border-rose-500/20 text-xs px-2 py-0.5 rounded-lg line-through"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Action & Delivery Destinations */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 mt-2 sm:mt-0">
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <span
                        className={`p-1 rounded-lg ${
                          rule.notifyEmail ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600'
                        }`}
                        title={rule.notifyEmail ? t.emailAlert : 'Email disabled'}
                      >
                        <Mail className="w-4 h-4" />
                      </span>
                      <span
                        className={`p-1 rounded-lg ${
                          rule.notifyWhatsApp ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600'
                        }`}
                        title={rule.notifyWhatsApp ? t.whatsAppAlert : 'WhatsApp disabled'}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </span>
                      <span
                        className={`p-1 rounded-lg ${
                          rule.notifyInApp ? 'text-sky-400 bg-sky-500/10' : 'text-slate-600'
                        }`}
                        title="In-app notification"
                      >
                        <Bell className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleRule(rule.id, !rule.enabled)}
                        aria-label={rule.enabled ? `${t.disabled} ${rule.name}` : `${t.active} ${rule.name}`}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          rule.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {rule.enabled ? t.active : t.disabled}
                      </button>

                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        aria-label={`${t.delete} ${rule.name}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
