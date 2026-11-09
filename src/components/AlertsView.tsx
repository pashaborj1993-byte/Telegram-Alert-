import React, { useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  Filter,
} from 'lucide-react';
import { AlertLog } from '../types.ts';
import { translations, Language } from '../utils/i18n.ts';

interface AlertsViewProps {
  alerts: AlertLog[];
  onClearAlerts: () => Promise<void>;
  onViewEmail: (alert: AlertLog) => void;
  onOpenSimulate: () => void;
  language: Language;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onClearAlerts,
  onViewEmail,
  onOpenSimulate,
  language,
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const t = translations[language];

  const filteredAlerts = alerts.filter(a => {
    if (filterPriority === 'all') return true;
    return a.priority === filterPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-400" />
            <span>{t.alertsTitle}</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {alerts.length} {t.totalAlerts}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.alertsDesc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <button
              onClick={onClearAlerts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearHistory}</span>
            </button>
          )}

          <button
            onClick={onOpenSimulate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.testSimulation}</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-1 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-400 font-medium">{t.filterPriority}</span>
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`text-xs px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
              filterPriority === p
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {p === 'all' ? t.all : p}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">{t.allCaughtUp}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t.noAlertsUnderFilter}
            </p>
            <button
              onClick={onOpenSimulate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.simulateMatchNow}
            </button>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const dateStr = new Date(alert.timestamp).toLocaleString(language === 'fa' ? 'fa-IR' : undefined);

            return (
              <div
                key={alert.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md shadow-slate-950/40"
              >
                {/* Alert Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        alert.priority === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : alert.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {alert.priority}
                    </span>

                    <span className="font-bold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg">
                      {alert.channel.startsWith('-') ? alert.channel : `@${alert.channel}`}
                    </span>

                    <span className="text-xs text-slate-300 font-semibold truncate">
                      {alert.ruleName}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {dateStr}
                  </span>
                </div>

                {/* Matched Keywords Badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-[11px] text-slate-500 font-medium">{t.triggeredBy}</span>
                  {alert.matchedKeywords.map(k => (
                    <span
                      key={k}
                      className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30"
                    >
                      {k}
                    </span>
                  ))}
                </div>

                {/* Message Snippet */}
                <p className="text-xs sm:text-sm text-slate-200 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 font-sans leading-relaxed whitespace-pre-wrap text-right sm:text-inherit">
                  {alert.postSnippet}
                </p>

                {/* Dispatch Status Cards */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Email Status */}
                    {alert.emailStatus !== 'disabled' && (
                      <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-xl">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Email: {alert.emailRecipient}</span>
                      </div>
                    )}

                    {/* WhatsApp Status */}
                    {alert.whatsAppStatus !== 'disabled' && (
                      <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-xl">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp: {alert.whatsAppRecipient || 'Active'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {alert.emailHtml && (
                      <button
                        onClick={() => onViewEmail(alert)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 transition-colors font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.viewEmail}</span>
                      </button>
                    )}

                    {alert.whatsAppUrl && (
                      <a
                        href={alert.whatsAppUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-medium shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.openWhatsApp}</span>
                      </a>
                    )}

                    {alert.postUrl && (
                      <a
                        href={alert.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title={t.viewOnTelegram}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
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
