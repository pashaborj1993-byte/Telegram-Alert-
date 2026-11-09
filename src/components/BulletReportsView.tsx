import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  Mail,
  MessageSquare,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Eye,
  RefreshCw,
  Bell,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { AlertLog, Channel } from '../types.ts';
import { Language } from '../utils/i18n.ts';
import { highlightKeywordsInHtml } from '../utils/telegramMatcher.ts';

interface BulletReportsViewProps {
  alerts: AlertLog[];
  channels: Channel[];
  onTriggerHourlyDigest: () => Promise<void>;
  onViewEmail: (alert: AlertLog) => void;
  emailRecipient: string;
  whatsAppPhone: string;
  language: Language;
  lastHourlyDispatch: number;
}

export const BulletReportsView: React.FC<BulletReportsViewProps> = ({
  alerts,
  channels,
  onTriggerHourlyDigest,
  onViewEmail,
  emailRecipient,
  whatsAppPhone,
  language,
  lastHourlyDispatch,
}) => {
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [copiedBulletId, setCopiedBulletId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const isFa = language === 'fa';

  // Filter alerts by channel
  const filteredAlerts = alerts.filter(a => {
    if (selectedChannelFilter === 'all') return true;
    return a.channel.toLowerCase() === selectedChannelFilter.toLowerCase();
  });

  // Calculate minutes to next hourly dispatch
  const minutesSince = Math.floor((Date.now() - (lastHourlyDispatch || Date.now())) / (1000 * 60));
  const minutesToNext = Math.max(1, 60 - (minutesSince % 60));

  const handleCopySingle = (alert: AlertLog) => {
    const text = `• [${alert.channel}] (${alert.priority.toUpperCase()})\n  کلیدواژه‌ها: ${alert.matchedKeywords.join(', ')}\n  متن: ${alert.postSnippet}\n  لینک تلگرام: ${alert.postUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedBulletId(alert.id);
    setTimeout(() => setCopiedBulletId(null), 2000);
  };

  const handleCopyFullBulletin = () => {
    const header = isFa
      ? `📋 بولتن تجمیعی رصد تلگرام (TeleAlert)\nتعداد موارد: ${filteredAlerts.length} مورد\nکانال‌ها: @mizanplus | @FarsNA | @iribnews\n───────────────────────\n\n`
      : `📋 TeleAlert Consolidated Bulletin\nMatches: ${filteredAlerts.length}\nChannels: @mizanplus | @FarsNA | @iribnews\n───────────────────────\n\n`;

    const body = filteredAlerts
      .map((a, i) =>
        `• #${i + 1} [${a.channel}] (${a.priority.toUpperCase()})\n  🔑 کلیدواژه‌ها: ${a.matchedKeywords.join(', ')}\n  📝 خلاصه خبر: "${a.postSnippet.replace(/\n+/g, ' ').slice(0, 200)}..."\n  🔗 لینک: ${a.postUrl}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(header + body);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleManualDispatch = async () => {
    setIsDispatching(true);
    try {
      await onTriggerHourlyDigest();
      setDispatchSuccess(true);
      setTimeout(() => setDispatchSuccess(false), 4000);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Automation reassurance */}
      <div className="bg-gradient-to-r from-slate-900/90 via-sky-950/40 to-slate-900/90 border border-sky-500/30 rounded-2xl p-5 shadow-lg shadow-sky-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isFa ? 'بولتن هوشمند و گزارش‌های تحلیلی خودکار' : 'Automated Bulleted Intelligence Reports'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isFa ? 'ارسال خودکار ۲۴ ساعته بدون نیاز به کلیک' : 'Automatic 24/7 Delivery • No Clicks Needed'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {isFa
                ? 'موتور پردازش پس‌زمینه به طور دائم کانال‌های میزان (قوه قضائیه)، فارس و صداوسیما را رصد می‌کند. کلیه موارد کشف‌شده به صورت خودکار در قالب بولتن‌های تمیز، بولت‌وار و دسته‌بندی‌شده به ایمیل و واتس‌اپ فرستاده می‌شوند.'
                : 'Background crawler continuously monitors @mizanplus, @FarsNA, and @iribnews. Matches are automatically organized into structured executive bullet points and delivered to recipients on schedule.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Copy Bulletin */}
            <button
              onClick={handleCopyFullBulletin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
              title={isFa ? 'کپی کل بولتن' : 'Copy entire bulletin'}
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی متن بولتن' : 'Copy Bulletin')}</span>
            </button>

            {/* Optional Immediate Trigger */}
            <button
              onClick={handleManualDispatch}
              disabled={isDispatching}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isDispatching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : dispatchSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {dispatchSuccess
                  ? (isFa ? 'بولتن ارسال شد!' : 'Dispatched!')
                  : (isFa ? 'ارسال دستی فوری (اختیاری)' : 'Send Now (Optional)')}
              </span>
            </button>
          </div>
        </div>

        {/* Schedule & Recipient Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{isFa ? 'زمان‌بندی ارسال بعدی:' : 'Next scheduled digest in:'}</span>
              <strong className="text-white font-mono">{minutesToNext} {isFa ? 'دقیقه' : 'min'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isFa ? 'گیرنده ایمیل:' : 'Email recipient:'}</span>
              <strong className="text-white">{emailRecipient}</strong>
            </span>
            {whatsAppPhone && (
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isFa ? 'واتس‌اپ:' : 'WhatsApp:'}</span>
                <strong className="text-white">{whatsAppPhone}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              {isFa ? 'فیلتر کانال:' : 'Filter channel:'}
            </span>
            <select
              value={selectedChannelFilter}
              onChange={e => setSelectedChannelFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1 focus:outline-none focus:border-sky-500"
            >
              <option value="all">{isFa ? 'همه کانال‌ها' : 'All Channels'} ({alerts.length})</option>
              {channels.map(c => (
                <option key={c.id} value={c.username}>
                  @{c.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulleted Report Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{isFa ? '📋 اقلام گزارش بولتن به تفکیک رخدادها' : '📋 Bulletin Event Items'}</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredAlerts.length} {isFa ? 'مورد' : 'items'}
            </span>
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isFa ? 'فرمت بهینه‌سازی‌شده برای مطالعه سریع و بایگانی' : 'Fine bulleting format for executive review'}
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-200">
              {isFa ? 'موردی برای نمایش در این فیلتر وجود ندارد' : 'No report items found'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isFa
                ? 'کانال‌ها در پس‌زمینه به صورت مداوم بررسی می‌شوند و به محض ثبت پست منطبق، در بولتن قرار خواهد گرفت.'
                : 'Channels are actively tracked. As soon as matching posts are identified, they appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert, index) => {
              const dateStr = new Date(alert.timestamp).toLocaleString(isFa ? 'fa-IR' : undefined);

              return (
                <div
                  key={alert.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md shadow-slate-950/40 relative overflow-hidden"
                >
                  {/* Left priority accent line */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1 ${
                      alert.priority === 'critical'
                        ? 'bg-rose-500'
                        : alert.priority === 'high'
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                  />

                  {/* Header metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                        #{index + 1}
                      </span>

                      <span className="font-bold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-lg">
                        @{alert.channel}
                      </span>

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

                      <span className="text-xs text-slate-300 font-medium truncate">
                        {alert.ruleName}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  {/* Matched Keywords Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isFa ? '🔑 کلیدواژه‌ها:' : 'Keywords:'}
                    </span>
                    {alert.matchedKeywords.map(k => (
                      <span
                        key={k}
                        className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/25"
                      >
                        {k}
                      </span>
                    ))}
                  </div>

                  {/* Bulleted News Item Text */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 my-2">
                    <div className="flex items-start gap-2">
                      <span className="text-sky-400 font-bold text-base leading-none select-none">•</span>
                      <div
                        className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap select-text text-right sm:text-inherit flex-1"
                        dangerouslySetInnerHTML={{
                          __html: highlightKeywordsInHtml(alert.postSnippet, alert.matchedKeywords),
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Strip: Direct Links & Dispatch Information */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                        <Mail className="w-3 h-3" />
                        <span>{isFa ? 'ثبت‌شده در بولتن ایمیل' : 'Included in Email Digest'}</span>
                      </div>

                      {alert.whatsAppRecipient && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                          <MessageSquare className="w-3 h-3" />
                          <span>{isFa ? 'آماده واتس‌اپ' : 'WhatsApp Ready'}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Copy single bullet */}
                      <button
                        onClick={() => handleCopySingle(alert)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title={isFa ? 'کپی این بند' : 'Copy this bullet item'}
                      >
                        {copiedBulletId === alert.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* View Rendered Email */}
                      {alert.emailHtml && (
                        <button
                          onClick={() => onViewEmail(alert)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 transition-colors font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isFa ? 'مشاهده قالب ایمیل' : 'View Email Format'}</span>
                        </button>
                      )}

                      {/* Direct Post Link */}
                      {alert.postUrl && (
                        <a
                          href={alert.postUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                          <span>{isFa ? 'لینک پست در تلگرام' : 'Open in Telegram'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
