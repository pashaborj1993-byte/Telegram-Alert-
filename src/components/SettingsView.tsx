import React, { useState } from 'react';
import {
  Settings,
  Mail,
  MessageSquare,
  Clock,
  Volume2,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Save,
  Send,
  Globe,
  BellRing,
} from 'lucide-react';
import { AppSettings } from '../types.ts';
import { playAlertSound } from '../utils/sound.ts';
import { translations, Language } from '../utils/i18n.ts';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onTestEmail: (email: string) => Promise<void>;
  onTestWhatsApp: (phone: string) => Promise<string | void>;
  onTriggerHourlyDigest: () => Promise<void>;
  language: Language;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onTestEmail,
  onTestWhatsApp,
  onTriggerHourlyDigest,
  language,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string | null>(null);
  const [digestStatus, setDigestStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const t = translations[language];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailStatus('sending');
    try {
      await onTestEmail(formData.emailRecipient);
      setEmailStatus('sent');
      setTimeout(() => setEmailStatus(null), 5000);
    } catch {
      setEmailStatus('error');
    }
  };

  const handleTestWhatsApp = async () => {
    setWaStatus('sending');
    try {
      const url = await onTestWhatsApp(formData.whatsAppRecipientPhone);
      setWaStatus('ready');
      if (typeof url === 'string') {
        window.open(url, '_blank');
      }
      setTimeout(() => setWaStatus(null), 5000);
    } catch {
      setWaStatus('error');
    }
  };

  const handleSendDigestNow = async () => {
    setDigestStatus('sending');
    try {
      await onTriggerHourlyDigest();
      setDigestStatus('sent');
      setTimeout(() => setDigestStatus(null), 5000);
    } catch {
      setDigestStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-4 h-4 text-sky-400" />
          <span>{t.settingsTitle}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t.settingsDesc}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notification Schedule & Hourly Dispatch Cadence */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{t.monitoringFreqTitle}</h3>
              <p className="text-xs text-slate-400">{t.monitoringFreqDesc}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, notificationSchedule: 'hourly' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.notificationSchedule === 'hourly'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>{t.hourlyDigestMode}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'fa' ? 'جمع‌آوری پیام‌های منطبق و ارسال گزارش خلاصه در هر ساعت' : 'Batches matching posts and sends a single digest every hour'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, notificationSchedule: 'immediate' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.notificationSchedule === 'immediate'
                    ? 'bg-sky-600/20 border-sky-500 text-white shadow-sm ring-1 ring-sky-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>{t.immediateMode}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'fa' ? 'ارسال بلادرنگ ایمیل و پیام به محض کشف کلیدواژه' : 'Instant alert sent the second a match is discovered'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, notificationSchedule: 'both' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.notificationSchedule === 'both'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{t.bothModes}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'fa' ? 'هشدارهای فوری + گزارش خلاصه ساعتی' : 'Instant critical alerts plus an hourly comprehensive digest'}
                </p>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300">
                {language === 'fa' ? 'آزمایش گزارش ساعتی همین الان:' : 'Test hourly digest dispatch right now:'}
              </span>
              <button
                type="button"
                onClick={handleSendDigestNow}
                disabled={digestStatus === 'sending'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{digestStatus === 'sending' ? (language === 'fa' ? 'در حال ارسال...' : 'Dispatching...') : t.sendHourlyNow}</span>
              </button>
            </div>

            {digestStatus === 'sent' && (
              <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{language === 'fa' ? 'گزارش ساعتی به ایمیل و واتس‌اپ ارسال شد!' : 'Hourly digest dispatched to email & WhatsApp!'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Email Notification Section */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{t.emailSectionTitle}</h3>
                <p className="text-xs text-slate-400">{t.emailSectionDesc}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="settingsEmailInput" className="block text-xs font-semibold text-slate-300 mb-1">
                {t.recipientEmailLabel}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="settingsEmailInput"
                  type="email"
                  required
                  value={formData.emailRecipient}
                  onChange={e => setFormData({ ...formData, emailRecipient: e.target.value })}
                  placeholder="pashaborj1993@gmail.com"
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.sendTestEmail}</span>
                </button>
              </div>
            </div>

            {emailStatus === 'sent' && (
              <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t.testEmailSent}</span>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Notification Section */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{t.whatsAppSectionTitle}</h3>
                <p className="text-xs text-slate-400">{t.whatsAppSectionDesc}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="settingsPhoneInput" className="block text-xs font-semibold text-slate-300 mb-1">
                {t.whatsAppPhoneLabel}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="settingsPhoneInput"
                  type="text"
                  value={formData.whatsAppRecipientPhone}
                  onChange={e => setFormData({ ...formData, whatsAppRecipientPhone: e.target.value })}
                  placeholder="+1-202-555-0143"
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t.testWhatsApp}</span>
                </button>
              </div>
            </div>

            {/* CallMeBot API key */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="settingsCallMeBotInput" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <span>{t.callMeBotKeyLabel}</span>
                  <a
                    href="https://www.callmebot.com/blog/free-api-whatsapp-messages/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline flex items-center gap-0.5 text-[11px]"
                  >
                    <span>{t.getFreeKey}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
              </div>
              <input
                id="settingsCallMeBotInput"
                type="password"
                value={formData.callMeBotApiKey}
                onChange={e => setFormData({ ...formData, callMeBotApiKey: e.target.value })}
                placeholder="Enter CallMeBot API Key"
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500">
                {t.callMeBotDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Polling Interval */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{t.pollIntervalLabel}</h3>
              <p className="text-xs text-slate-400">
                {language === 'fa' ? 'مدت زمان بین بررسی کانال‌ها در پس‌زمینه' : 'Background polling interval across Telegram streams'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[15, 30, 60, 120].map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => setFormData({ ...formData, pollIntervalSeconds: sec })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  formData.pollIntervalSeconds === sec
                    ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {language === 'fa' ? `هر ${sec} ثانیه` : `Every ${sec}s`} {sec === 30 && (language === 'fa' ? '(پیش‌فرض)' : '(Default)')}
              </button>
            ))}
          </div>
        </div>

        {/* Audio & Alert Feedback */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{t.audioSectionTitle}</h3>
              <p className="text-xs text-slate-400">{t.audioSectionDesc}</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-200">{t.alertChimeSound}</span>
              <p className="text-[11px] text-slate-500">
                {language === 'fa' ? 'پخش صدای زنگ هنگام تطبیق کلیدواژه‌های حساس' : 'Synthesized audio chime on positive matches'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playAlertSound('critical')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                {t.testSound}
              </button>
              <input
                type="checkbox"
                aria-label={t.alertChimeSound}
                checked={formData.soundEnabled}
                onChange={e => setFormData({ ...formData, soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Android PWA Information Card */}
        <div className="bg-gradient-to-r from-sky-950/40 to-slate-900/70 border border-sky-900/50 rounded-2xl p-5 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.pwaTitle}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.pwaDesc}
            </p>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {t.savedSuccess}
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              {language === 'fa' ? 'تغییرات بلافاصله اعمال می‌شوند' : 'Changes take effect immediately'}
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t.saving : t.saveSettings}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
