export interface Channel {
  id: string;
  username: string;
  title: string;
  description: string;
  subscribers?: string;
  lastChecked: number;
  lastPostId?: string;
  status: 'active' | 'paused' | 'error';
  webUrl?: string;
  recentPosts: Array<{
    id: string;
    text: string;
    date: string;
    views?: string;
    url: string;
  }>;
}

export interface KeywordRule {
  id: string;
  name: string;
  channelIds: string[]; // empty means all channels
  keywords: string[];
  excludedKeywords?: string[];
  caseSensitive?: boolean;
  wholeWord?: boolean;
  isRegex?: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  notifyEmail: boolean;
  notifyWhatsApp: boolean;
  notifyInApp: boolean;
  cooldownMinutes?: number;
  enabled: boolean;
}

export interface AlertLog {
  id: string;
  timestamp: number;
  channel: string;
  ruleId: string;
  ruleName: string;
  matchedKeywords: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  postSnippet: string;
  postUrl: string;
  emailStatus: 'sent' | 'failed' | 'simulated' | 'disabled';
  emailRecipient: string;
  emailSubject?: string;
  emailHtml?: string;
  whatsAppStatus: 'sent' | 'pending' | 'ready' | 'simulated' | 'disabled';
  whatsAppRecipient?: string;
  whatsAppUrl?: string;
  read: boolean;
}

export interface AppSettings {
  language: 'en' | 'fa';
  notificationSchedule: 'hourly' | 'immediate' | 'both';
  lastHourlyDispatch: number;
  emailRecipient: string;
  smtpConfigured: boolean;
  smtpHost?: string;
  smtpUser?: string;
  whatsAppRecipientPhone: string;
  callMeBotApiKey: string;
  pollIntervalSeconds: number;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}
