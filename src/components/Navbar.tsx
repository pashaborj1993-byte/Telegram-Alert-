import React from 'react';
import {
  Send,
  Radio,
  Volume2,
  VolumeX,
  Pause,
  Sparkles,
  Globe,
  Clock,
} from 'lucide-react';
import { translations, Language } from '../utils/i18n.ts';

interface NavbarProps {
  activeTab: 'feed' | 'channels' | 'rules' | 'reports' | 'alerts' | 'settings';
  setActiveTab: (tab: 'feed' | 'channels' | 'rules' | 'reports' | 'alerts' | 'settings') => void;
  monitorActive: boolean;
  onToggleMonitor: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  unreadCount: number;
  onOpenSimulate: () => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  onTriggerHourlyDigest: () => Promise<void>;
  currentUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  authLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  monitorActive,
  onToggleMonitor,
  soundEnabled,
  onToggleSound,
  unreadCount,
  onOpenSimulate,
  language,
  onToggleLanguage,
  onTriggerHourlyDigest,
  currentUser,
  onSignIn,
  onSignOut,
  authLoading,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 shadow-lg shadow-sky-500/20 text-white shrink-0">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    monitorActive ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    monitorActive ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">{t.appTitle}</span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {t.liveDispatcher}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'feed'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.tabFeed}
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'channels'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.tabChannels}
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'rules'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.tabRules}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-sm'
                  : 'text-sky-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{t.tabReports}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'alerts'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.tabAlerts}
              {unreadCount > 0 && (
                <span className="mx-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'settings'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.tabSettings}
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Bilingual Language Switcher */}
            <button
              onClick={() => onToggleLanguage(language === 'fa' ? 'en' : 'fa')}
              aria-label="Toggle language between English and Persian"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 transition-colors shadow-sm"
              title={language === 'fa' ? 'Switch to English' : 'تغییر به زبان فارسی'}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{language === 'fa' ? 'English' : 'فارسی'}</span>
            </button>

            {/* Quick Hourly Dispatch Trigger */}
            <button
              onClick={onTriggerHourlyDigest}
              aria-label={t.sendHourlyNow}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
              title={t.sendHourlyNow}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{t.hourlyDigest}</span>
            </button>

            {/* Monitor Pause/Resume Toggle */}
            <button
              onClick={onToggleMonitor}
              aria-label={monitorActive ? t.monitoringPaused : t.monitoringActive}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                monitorActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {monitorActive ? (
                <>
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span className="hidden lg:inline">{t.monitoring}</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">{t.paused}</span>
                </>
              )}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              aria-label={soundEnabled ? t.muteSound : t.enableSound}
              className={`p-2 rounded-lg text-xs border transition-colors ${
                soundEnabled
                  ? 'bg-slate-900 text-sky-400 border-slate-800 hover:bg-slate-800'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
              title={soundEnabled ? t.enableSound : t.muteSound}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Google Authentication Button / User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-sky-400/40 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-[11px] font-bold text-white leading-none max-w-[110px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-medium leading-none mt-0.5">
                    {t.personalDashboard}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="text-[11px] text-slate-400 hover:text-rose-400 px-1 py-0.5 transition-colors font-medium ml-1"
                  title={t.signOut}
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                disabled={authLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{authLoading ? t.signingIn : t.signInWithGoogle}</span>
              </button>
            )}

            {/* Quick Test Simulator Button */}
            <button
              onClick={onOpenSimulate}
              aria-label={t.simulateIncomingPost}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.simulatePost}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
