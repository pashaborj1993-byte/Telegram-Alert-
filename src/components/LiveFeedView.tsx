import React, { useState } from 'react';
import {
  Radio,
  Eye,
  ExternalLink,
  Mail,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Channel, KeywordRule, AlertLog } from '../types.ts';
import { matchKeywords, highlightKeywordsInHtml } from '../utils/telegramMatcher.ts';
import { translations, Language } from '../utils/i18n.ts';

interface LiveFeedViewProps {
  channels: Channel[];
  rules: KeywordRule[];
  alerts: AlertLog[];
  onRefreshChannel: (id: string) => Promise<void>;
  onOpenSimulate: () => void;
  onViewEmail: (alert: AlertLog) => void;
  onNavigateToTab: (tab: 'channels' | 'rules' | 'reports' | 'alerts' | 'settings') => void;
  emailRecipient: string;
  whatsAppPhone: string;
  language: Language;
  lastHourlyDispatch: number;
  onTriggerHourlyDigest: () => Promise<void>;
}

export const LiveFeedView: React.FC<LiveFeedViewProps> = ({
  channels,
  rules,
  alerts,
  onRefreshChannel,
  onOpenSimulate,
  onViewEmail,
  onNavigateToTab,
  emailRecipient,
  whatsAppPhone,
  language,
  lastHourlyDispatch,
  onTriggerHourlyDigest,
}) => {
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [digestSuccess, setDigestSuccess] = useState(false);

  const t = translations[language];

  // Flatten recent posts from all active channels
  const allPosts = channels
    .filter(c => selectedChannelFilter === 'all' || c.id === selectedChannelFilter)
    .flatMap(c =>
      c.recentPosts.map(p => ({
        ...p,
        channelUsername: c.username,
        channelTitle: c.title,
        channelId: c.id,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredPosts = allPosts.filter(p => {
    if (!searchTerm) return true;
    return (
      p.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.channelUsername.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      for (const c of channels) {
        await onRefreshChannel(c.id);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualDigest = async () => {
    setSendingDigest(true);
    try {
      await onTriggerHourlyDigest();
      setDigestSuccess(true);
      setTimeout(() => setDigestSuccess(false), 4000);
    } finally {
      setSendingDigest(false);
    }
  };

  // Minutes since last hourly dispatch
  const minutesSinceHourly = Math.floor((Date.now() - (lastHourlyDispatch || Date.now())) / (1000 * 60));
  const minutesUntilNext = Math.max(1, 60 - (minutesSinceHourly % 60));

  return (
    <div className="space-y-6">
      {/* 24/7 Monitoring & Hourly Notification Status Bar */}
      <div className="bg-gradient-to-r from-slate-900/90 via-sky-950/40 to-slate-900/90 border border-sky-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-sky-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t.runsAlways}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {t.hourlyDigest}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {t.nextHourlyIn}: <strong className="text-sky-300">{minutesUntilNext} {language === 'fa' ? 'دقیقه' : 'min'}</strong> &bull; {t.dispatchedTo} <span className="text-white font-medium">{emailRecipient}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {digestSuccess ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'fa' ? 'گزارش ساعتی ارسال شد!' : 'Hourly Digest Sent!'}
            </span>
          ) : (
            <button
              onClick={handleManualDigest}
              disabled={sendingDigest}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendingDigest ? (language === 'fa' ? 'در حال ارسال...' : 'Dispatching...') : t.sendHourlyNow}</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.statChannels}</span>
            <Radio className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{channels.length}</span>
            <button
              onClick={() => onNavigateToTab('channels')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium hover:underline"
            >
              {t.manage}
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.statRules}</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              {rules.filter(r => r.enabled).length}
            </span>
            <button
              onClick={() => onNavigateToTab('rules')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium hover:underline"
            >
              {t.configure}
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.statAlerts}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">{alerts.length}</span>
            <button
              onClick={() => onNavigateToTab('alerts')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium hover:underline"
            >
              {t.outbox}
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.statPrimary}</span>
            <Mail className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-xs font-semibold text-white truncate" title={emailRecipient}>
              {emailRecipient || 'Not set'}
            </div>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <span>WA:</span>
              <span className="text-slate-300">{whatsAppPhone || 'Direct Link'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Simulation Callout */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedChannelFilter}
              onChange={e => setSelectedChannelFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">{t.allChannels} ({channels.length})</option>
              {channels.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.username.startsWith('-') ? c.title : `@${c.username}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span>{refreshing ? t.fetching : t.fetchFeed}</span>
          </button>

          <button
            onClick={onOpenSimulate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.simulateIncomingPost}</span>
          </button>
        </div>
      </div>

      {/* Feed Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>{t.liveStream}</span>
            <span className="text-xs normal-case font-normal text-slate-400">
              ({filteredPosts.length} {t.postsInspected})
            </span>
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {t.realTimeMatching}
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
            <Radio className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">{t.noPostsYet}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t.noPostsDesc}
            </p>
            <button
              onClick={onOpenSimulate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.simulatePost}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map(post => {
              // Check which rules match this post
              const matchingRules = rules.filter(r => {
                if (!r.enabled) return false;
                if (r.channelIds && r.channelIds.length > 0 && !r.channelIds.includes(post.channelId)) {
                  return false;
                }
                const res = matchKeywords(post.text, {
                  keywords: r.keywords,
                  excludedKeywords: r.excludedKeywords,
                  caseSensitive: r.caseSensitive,
                  wholeWord: r.wholeWord,
                  isRegex: r.isRegex,
                });
                return res.matched;
              });

              // Check if there is an alert recorded for this post
              const matchedAlert = alerts.find(a =>
                a.channel.toLowerCase() === post.channelUsername.toLowerCase() &&
                post.text.includes(a.matchedKeywords[0] || '')
              );

              // Gather all matched keywords for highlighting
              const allMatchedKws = Array.from(
                new Set(matchingRules.flatMap(r => r.keywords.filter(k => post.text.toLowerCase().includes(k.toLowerCase()))))
              );

              const hasMatch = matchingRules.length > 0;

              return (
                <div
                  key={`${post.channelUsername}-${post.id}`}
                  className={`relative p-4 rounded-2xl border transition-all ${
                    hasMatch
                      ? 'bg-slate-900/90 border-sky-500/50 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/20'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Channel & Metadata Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg">
                        {post.channelUsername.startsWith('-') ? post.channelUsername : `@${post.channelUsername}`}
                      </span>
                      <span className="text-xs text-slate-300 font-medium truncate max-w-[240px]">
                        {post.channelTitle}
                      </span>
                      {hasMatch && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                          <Flame className="w-3 h-3" />
                          {t.keywordMatch}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      {post.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-500" />
                          {post.views}
                        </span>
                      )}
                      <span>
                        {new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-sky-400 transition-colors p-1"
                        title={t.viewOnTelegram}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div
                    className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text py-1 text-right sm:text-inherit"
                    dangerouslySetInnerHTML={{
                      __html: highlightKeywordsInHtml(post.text, allMatchedKws),
                    }}
                  />

                  {/* Matched Rules & Dispatch Status */}
                  {hasMatch && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-medium">{t.matched}</span>
                        {matchingRules.map(rule => (
                          <span
                            key={rule.id}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              rule.priority === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : rule.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {rule.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Email Dispatch Indicator */}
                        <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Mail className="w-3 h-3" />
                          <span>{t.dispatchedTo} {emailRecipient.split('@')[0]}@...</span>
                        </div>

                        {/* WhatsApp Indicator / Action */}
                        {matchedAlert?.whatsAppUrl ? (
                          <a
                            href={matchedAlert.whatsAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{t.whatsApp}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                            <MessageSquare className="w-3 h-3" />
                            <span>{t.waReady}</span>
                          </div>
                        )}

                        {matchedAlert && (
                          <button
                            onClick={() => onViewEmail(matchedAlert)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 underline font-medium"
                          >
                            {t.inspectAlert}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
