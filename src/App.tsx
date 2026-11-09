import React, { useState, useEffect, useRef } from 'react';
import {
  Navbar,
} from './components/Navbar.tsx';
import { LiveFeedView } from './components/LiveFeedView.tsx';
import { ChannelsView } from './components/ChannelsView.tsx';
import { RulesView } from './components/RulesView.tsx';
import { BulletReportsView } from './components/BulletReportsView.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { SimulatePostModal } from './components/SimulatePostModal.tsx';
import { EmailViewerModal } from './components/EmailViewerModal.tsx';
import { AddChannelModal } from './components/AddChannelModal.tsx';
import { CreateRuleModal } from './components/CreateRuleModal.tsx';
import { Channel, KeywordRule, AlertLog, AppSettings } from './types.ts';
import { playAlertSound } from './utils/sound.ts';
import { translations, Language } from './utils/i18n.ts';
import {
  Radio,
  Flame,
  Bell,
  Settings as SettingsIcon,
  Layers,
  X,
  FileText,
} from 'lucide-react';

import { auth, signInWithGoogle, logOut, testFirestoreConnection } from './firebase.ts';
import {
  getUserChannels,
  saveUserChannel,
  deleteUserChannel,
  getUserRules,
  saveUserRule,
  deleteUserRule,
  getUserAlerts,
  saveUserAlert,
  clearUserAlerts,
  getUserSettings,
  saveUserSettings,
} from './utils/firestoreService.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'channels' | 'rules' | 'reports' | 'alerts' | 'settings'>('reports');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rules, setRules] = useState<KeywordRule[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [language, setLanguage] = useState<Language>('fa');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'fa',
    notificationSchedule: 'hourly',
    lastHourlyDispatch: Date.now() - 1000 * 60 * 35,
    emailRecipient: 'pashaborj1993@gmail.com',
    smtpConfigured: false,
    whatsAppRecipientPhone: '+1-202-555-0143',
    callMeBotApiKey: '',
    pollIntervalSeconds: 30,
    soundEnabled: true,
    desktopNotifications: true,
  });
  const [monitorActive, setMonitorActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [emailModalAlert, setEmailModalAlert] = useState<AlertLog | null>(null);

  // Active floating toast for real-time alerts
  const [latestToastAlert, setLatestToastAlert] = useState<AlertLog | null>(null);

  const prevAlertsCount = useRef<number>(0);

  // Test Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        // Load personalized cloud dashboard for this user
        try {
          const userChans = await getUserChannels(user.uid);
          const userRules = await getUserRules(user.uid);
          const userSettings = await getUserSettings(user.uid, user.email || undefined);
          const userAlerts = await getUserAlerts(user.uid);

          setChannels(userChans);
          setRules(userRules);
          setSettings(userSettings);
          if (userSettings.language) setLanguage(userSettings.language);
          if (userAlerts.length > 0) setAlerts(userAlerts);
        } catch (err) {
          console.error('Error loading user cloud data:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync RTL and lang attribute
  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Fetch initial/refreshed state
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return;
      const data = await res.json();

      // If user is logged in, their custom channels/rules take precedence from Firestore
      if (!currentUser) {
        setChannels(data.channels || []);
        setRules(data.rules || []);
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.language) setLanguage(data.settings.language);
        }
      }

      const newAlerts: AlertLog[] = data.alerts || [];
      // If new alert arrived since last check and not first load, play sound & show toast
      if (prevAlertsCount.current > 0 && newAlerts.length > prevAlertsCount.current) {
        const newest = newAlerts[0];
        if (newest) {
          setLatestToastAlert(newest);
          if (settings.soundEnabled) {
            playAlertSound(newest.priority);
          }
        }
      }
      prevAlertsCount.current = newAlerts.length;

      if (!currentUser || alerts.length === 0) {
        setAlerts(newAlerts);
      }
      if (data.monitorActive !== undefined) setMonitorActive(data.monitorActive);
    } catch (e) {
      console.error('Failed to load state:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, []);

  // Language toggle
  const handleToggleLanguage = async (newLang: Language) => {
    setLanguage(newLang);
    const updated = { ...settings, language: newLang };
    setSettings(updated);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: newLang }),
    });
  };

  // Monitor toggle
  const handleToggleMonitor = async () => {
    try {
      const res = await fetch('/api/monitor/toggle', { method: 'POST' });
      const data = await res.json();
      setMonitorActive(data.monitorActive);
    } catch (e) {
      console.error(e);
    }
  };

  // Sound toggle
  const handleToggleSound = async () => {
    const nextVal = !settings.soundEnabled;
    const next = { ...settings, soundEnabled: nextVal };
    setSettings(next);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soundEnabled: nextVal }),
    });
  };

  // Add Channel
  const handleAddChannel = async (username: string) => {
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add channel');
    }
    const addedChan: Channel = await res.json();
    if (currentUser) {
      await saveUserChannel(currentUser.uid, addedChan);
      setChannels(prev => [addedChan, ...prev.filter(c => c.username !== addedChan.username)]);
    } else {
      await fetchState();
    }
  };

  // Refresh Channel
  const handleRefreshChannel = async (id: string) => {
    const res = await fetch(`/api/channels/${id}/refresh`, { method: 'POST' });
    if (res.ok) {
      const refreshed: Channel = await res.json();
      if (currentUser) {
        await saveUserChannel(currentUser.uid, refreshed);
        setChannels(prev => prev.map(c => c.id === id ? refreshed : c));
      } else {
        await fetchState();
      }
    }
  };

  // Toggle Channel Status
  const handleToggleChannelStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    await fetch(`/api/channels/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    const chan = channels.find(c => c.id === id);
    if (chan && currentUser) {
      const updated = { ...chan, status: nextStatus as 'active' | 'paused' };
      await saveUserChannel(currentUser.uid, updated);
      setChannels(prev => prev.map(c => c.id === id ? updated : c));
    } else {
      await fetchState();
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (id: string) => {
    await fetch(`/api/channels/${id}`, { method: 'DELETE' });
    if (currentUser) {
      await deleteUserChannel(currentUser.uid, id);
      setChannels(prev => prev.filter(c => c.id !== id));
    } else {
      await fetchState();
    }
  };

  // Create Rule
  const handleCreateRule = async (ruleData: Omit<KeywordRule, 'id'>) => {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create rule');
    }
    const createdRule: KeywordRule = await res.json();
    if (currentUser) {
      await saveUserRule(currentUser.uid, createdRule);
      setRules(prev => [createdRule, ...prev]);
    } else {
      await fetchState();
    }
  };

  // Toggle Rule
  const handleToggleRule = async (id: string, enabled: boolean) => {
    await fetch(`/api/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const rule = rules.find(r => r.id === id);
    if (rule && currentUser) {
      const updated = { ...rule, enabled };
      await saveUserRule(currentUser.uid, updated);
      setRules(prev => prev.map(r => r.id === id ? updated : r));
    } else {
      await fetchState();
    }
  };

  // Delete Rule
  const handleDeleteRule = async (id: string) => {
    await fetch(`/api/rules/${id}`, { method: 'DELETE' });
    if (currentUser) {
      await deleteUserRule(currentUser.uid, id);
      setRules(prev => prev.filter(r => r.id !== id));
    } else {
      await fetchState();
    }
  };

  // Clear Alerts
  const handleClearAlerts = async () => {
    await fetch('/api/alerts', { method: 'DELETE' });
    if (currentUser) {
      await clearUserAlerts(currentUser.uid);
      setAlerts([]);
    } else {
      await fetchState();
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    setSettings(newSettings);
    if (newSettings.language) setLanguage(newSettings.language);
    if (currentUser) {
      await saveUserSettings(currentUser.uid, newSettings);
    }
  };

  // Test Email
  const handleTestEmail = async (email: string) => {
    const res = await fetch('/api/alerts/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.alert) {
      setAlerts(prev => [data.alert, ...prev]);
    }
  };

  // Test WhatsApp
  const handleTestWhatsApp = async (phone: string) => {
    const res = await fetch('/api/alerts/test-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (data.alert) {
      setAlerts(prev => [data.alert, ...prev]);
    }
    return data.url;
  };

  // Trigger Hourly Digest
  const handleTriggerHourlyDigest = async () => {
    const res = await fetch('/api/alerts/hourly-digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    await fetchState();
    if (data.log) {
      setEmailModalAlert(data.log);
    }
  };

  // Simulate Post
  const handleSimulatePost = async (channelUsername: string, text: string) => {
    const res = await fetch('/api/alerts/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelUsername, text }),
    });
    const data = await res.json();
    await fetchState();
    if (data.alerts && data.alerts.length > 0) {
      playAlertSound('critical');
      setLatestToastAlert(data.alerts[0]);
    }
    return data;
  };

  const t = translations[language];
  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16 md:pb-6 ${language === 'fa' ? 'rtl' : 'ltr'}`}>
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        monitorActive={monitorActive}
        onToggleMonitor={handleToggleMonitor}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        unreadCount={unreadAlertsCount}
        onOpenSimulate={() => setIsSimulateOpen(true)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onTriggerHourlyDigest={handleTriggerHourlyDigest}
        currentUser={currentUser}
        onSignIn={async () => {
          try {
            await signInWithGoogle();
          } catch (e) {
            console.error('Google Sign-in failed:', e);
          }
        }}
        onSignOut={async () => {
          try {
            await logOut();
            await fetchState();
          } catch (e) {
            console.error('Logout failed:', e);
          }
        }}
        authLoading={authLoading}
      />

      {/* Cloud Sync Announcement Banner if not signed in */}
      {!currentUser && !authLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-sky-950/60 border border-sky-500/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-sky-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {t.personalDashboard} ({t.guestMode})
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                  {t.loginPrompt}
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (e) {
                  console.error(e);
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all shrink-0"
            >
              <span>{t.loginToSync}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <Radio className="w-8 h-8 text-sky-400 animate-pulse" />
            <div className="text-sm text-slate-400 font-medium">
              {language === 'fa' ? 'در حال اتصال به جریان پایش تلگرام...' : 'Connecting to Telegram monitor stream...'}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'feed' && (
              <LiveFeedView
                channels={channels}
                rules={rules}
                alerts={alerts}
                onRefreshChannel={handleRefreshChannel}
                onOpenSimulate={() => setIsSimulateOpen(true)}
                onViewEmail={alert => setEmailModalAlert(alert)}
                onNavigateToTab={tab => setActiveTab(tab)}
                emailRecipient={settings.emailRecipient}
                whatsAppPhone={settings.whatsAppRecipientPhone}
                language={language}
                lastHourlyDispatch={settings.lastHourlyDispatch}
                onTriggerHourlyDigest={handleTriggerHourlyDigest}
              />
            )}

            {activeTab === 'channels' && (
              <ChannelsView
                channels={channels}
                onAddChannel={() => setIsAddChannelOpen(true)}
                onRefreshChannel={handleRefreshChannel}
                onToggleChannelStatus={handleToggleChannelStatus}
                onDeleteChannel={handleDeleteChannel}
                language={language}
              />
            )}

            {activeTab === 'rules' && (
              <RulesView
                rules={rules}
                channels={channels}
                onCreateRule={() => setIsCreateRuleOpen(true)}
                onToggleRule={handleToggleRule}
                onDeleteRule={handleDeleteRule}
                language={language}
              />
            )}

            {activeTab === 'reports' && (
              <BulletReportsView
                alerts={alerts}
                channels={channels}
                onTriggerHourlyDigest={handleTriggerHourlyDigest}
                onViewEmail={alert => setEmailModalAlert(alert)}
                emailRecipient={settings.emailRecipient}
                whatsAppPhone={settings.whatsAppRecipientPhone}
                language={language}
                lastHourlyDispatch={settings.lastHourlyDispatch}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                alerts={alerts}
                onClearAlerts={handleClearAlerts}
                onViewEmail={alert => setEmailModalAlert(alert)}
                onOpenSimulate={() => setIsSimulateOpen(true)}
                language={language}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onTestEmail={handleTestEmail}
                onTestWhatsApp={handleTestWhatsApp}
                onTriggerHourlyDigest={handleTriggerHourlyDigest}
                language={language}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Real-Time Alert Toast */}
      {latestToastAlert && (
        <div className={`fixed bottom-20 md:bottom-6 ${language === 'fa' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} z-40 max-w-sm w-full bg-slate-900 border border-sky-500/50 shadow-2xl shadow-sky-950/80 rounded-2xl p-4 animate-in slide-in-from-bottom-5 duration-200`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase">
                {latestToastAlert.priority === 'critical' ? (language === 'fa' ? 'بحرانی' : 'Critical') : latestToastAlert.priority}
              </span>
              <span className="text-xs font-bold text-sky-400">{latestToastAlert.channel}</span>
            </div>
            <button
              onClick={() => setLatestToastAlert(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 text-xs text-slate-200 line-clamp-2 text-right sm:text-inherit">
            {latestToastAlert.postSnippet}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-amber-300 font-semibold truncate">
              {t.matched} {latestToastAlert.matchedKeywords.join('، ')}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setEmailModalAlert(latestToastAlert);
                  setLatestToastAlert(null);
                }}
                className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px]"
              >
                {t.inspectAlert}
              </button>
              {latestToastAlert.whatsAppUrl && (
                <a
                  href={latestToastAlert.whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px]"
                >
                  {t.whatsApp}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md px-2 py-1 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'feed' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>{t.tabFeed}</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'channels' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 mb-0.5" />
          <span>{t.tabChannels}</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'rules' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 mb-0.5" />
          <span>{t.tabRules}</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
            activeTab === 'reports' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>{t.tabReports}</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`relative flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'alerts' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4 mb-0.5" />
          <span>{t.tabAlerts}</span>
          {unreadAlertsCount > 0 && (
            <span className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'settings' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4 mb-0.5" />
          <span>{t.tabSettings}</span>
        </button>
      </nav>

      {/* Interactive Modals */}
      <SimulatePostModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        channels={channels}
        onSimulate={handleSimulatePost}
        language={language}
      />

      <EmailViewerModal
        alert={emailModalAlert}
        onClose={() => setEmailModalAlert(null)}
      />

      <AddChannelModal
        isOpen={isAddChannelOpen}
        onClose={() => setIsAddChannelOpen(false)}
        onAddChannel={handleAddChannel}
        language={language}
      />

      <CreateRuleModal
        isOpen={isCreateRuleOpen}
        onClose={() => setIsCreateRuleOpen(false)}
        channels={channels}
        onCreateRule={handleCreateRule}
        defaultEmail={settings.emailRecipient}
        defaultPhone={settings.whatsAppRecipientPhone}
        language={language}
      />
    </div>
  );
}
