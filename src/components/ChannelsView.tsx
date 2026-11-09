import React, { useState } from 'react';
import {
  Radio,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Pause,
  Play,
  Users,
  Clock,
} from 'lucide-react';
import { Channel } from '../types.ts';
import { translations, Language } from '../utils/i18n.ts';

interface ChannelsViewProps {
  channels: Channel[];
  onAddChannel: () => void;
  onRefreshChannel: (id: string) => Promise<void>;
  onToggleChannelStatus: (id: string, currentStatus: string) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;
  language: Language;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({
  channels,
  onAddChannel,
  onRefreshChannel,
  onToggleChannelStatus,
  onDeleteChannel,
  language,
}) => {
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const t = translations[language];

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      await onRefreshChannel(id);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Channel Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <span>{t.monitoredChannels}</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {channels.length} {t.activeCount}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.channelsDesc}
          </p>
        </div>

        <button
          onClick={onAddChannel}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addChannel}</span>
        </button>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map(channel => {
          const isPaused = channel.status === 'paused';
          const isRefreshing = refreshingId === channel.id;

          const channelLink = channel.webUrl || (channel.username.startsWith('-')
            ? `https://web.telegram.org/a/#${channel.username}`
            : `https://t.me/${channel.username}`);

          return (
            <div
              key={channel.id}
              className={`flex flex-col justify-between bg-slate-900/70 border rounded-2xl p-4 transition-all ${
                isPaused
                  ? 'border-slate-800/60 opacity-75'
                  : 'border-slate-800 hover:border-slate-700 shadow-md shadow-slate-950/50'
              }`}
            >
              <div>
                {/* Channel Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white truncate">{channel.title}</h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isPaused
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isPaused ? t.paused : t.active}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <a
                        href={channelLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 group font-mono"
                      >
                        <span>{channel.username.startsWith('-') ? channel.username : `@${channel.username}`}</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                      {channel.subscribers && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          {channel.subscribers}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {channel.description && (
                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {channel.description}
                  </p>
                )}

                {/* Latest Post Snippet */}
                <div className="mt-3 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-medium text-slate-400">{t.latestPostPreview}</span>
                    {channel.recentPosts[0] && (
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(channel.recentPosts[0].date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  {channel.recentPosts[0] ? (
                    <p className="text-xs text-slate-300 line-clamp-2 italic">
                      "{channel.recentPosts[0].text}"
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">{t.noPostsCached}</p>
                  )}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {t.checked} {new Date(channel.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRefresh(channel.id)}
                    disabled={isRefreshing}
                    aria-label={`${t.refresh} ${channel.title}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                    title={t.refresh}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => onToggleChannelStatus(channel.id, channel.status)}
                    aria-label={isPaused ? `${t.resume} ${channel.title}` : `${t.pause} ${channel.title}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={isPaused ? t.resume : t.pause}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  </button>

                  <button
                    onClick={() => onDeleteChannel(channel.id)}
                    aria-label={`${t.delete} ${channel.title}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
