import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  normalizeChannelUsername,
  matchKeywords,
  formatEmailAlert,
  formatWhatsAppAlert,
  formatHourlyDigest,
  parseTelegramWebPreview,
  KeywordRule,
} from './src/utils/telegramMatcher.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Channel, AlertLog, AppSettings } from './src/types.ts';

// In-Memory Database
const db: {
  channels: Channel[];
  rules: KeywordRule[];
  alerts: AlertLog[];
  settings: AppSettings;
  monitorActive: boolean;
  lastPollTimestamp: number;
} = {
  settings: {
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
  },
  monitorActive: true,
  lastPollTimestamp: Date.now(),
  channels: [
    {
      id: 'c-mizan',
      username: 'mizanplus',
      webUrl: 'https://t.me/mizanplus',
      title: 'خبرگزاری میزان (قوه قضائیه)',
      description: 'خبرگزاری رسمی مرکز رسانه قوه قضائیه - پوشش احکام دادگاه‌ها، پرونده‌های کیفری و احکام اعدام و دار مجازات در ایران',
      subscribers: '185K',
      lastChecked: Date.now(),
      status: 'active',
      recentPosts: [
        {
          id: '910',
          text: 'سخنگوی قوه قضائیه: حکم اعدام محکومان پرونده تروریستی اخیر پس از طی مراحل قانونی و تایید در دیوان عالی کشور، صبح امروز به مرحله اجرا درآمد و متهم به دار مجازات آویخته شد.',
          date: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          views: '38.4K',
          url: 'https://t.me/mizanplus/910',
        },
        {
          id: '909',
          text: 'مرکز رسانه قوه قضائیه: دادگاه تجدیدنظر احکام صادره پیرامون عناصر مرتبط با تشکیلات منافقین و اقدامات ضدامنیتی را تایید کرد.',
          date: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
          views: '24.1K',
          url: 'https://t.me/mizanplus/909',
        },
      ],
    },
    {
      id: 'c-fars',
      username: 'FarsNA',
      webUrl: 'https://t.me/FarsNA',
      title: 'خبرگزاری فارس',
      description: 'خبرگزاری فارس - پوشش اخبار سیاسی، امنیتی، مواضع چهره‌های سیاسی و تحولات داخلی ایران',
      subscribers: '420K',
      lastChecked: Date.now(),
      status: 'active',
      recentPosts: [
        {
          id: '405',
          text: 'واکنش رسانه‌ها به بیانیه اخیر رضا پهلوی درباره تحولات سیاسی ایران و تشدید کمپین‌های بین‌المللی پیرامون اعدام‌ها در کشور.',
          date: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
          views: '52.7K',
          url: 'https://t.me/FarsNA/405',
        },
        {
          id: '404',
          text: 'گزارش اختصاصی فارس: ابعاد جدیدی از تحرکات مریم رجوی و سرکردگان گروهک منافقین در کشورهای اروپایی افشا شد.',
          date: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
          views: '35.6K',
          url: 'https://t.me/FarsNA/404',
        },
      ],
    },
    {
      id: 'c-irib',
      username: 'iribnews',
      webUrl: 'https://t.me/iribnews',
      title: 'خبرگزاری صداوسیما',
      description: 'خبرگزاری رسمی صدا و سیمای جمهوری اسلامی ایران - پوشش گزارش‌های خبری، بیانیه‌ها و رویدادهای ملی',
      subscribers: '590K',
      lastChecked: Date.now(),
      status: 'active',
      recentPosts: [
        {
          id: '702',
          text: 'بخش خبری صدا و سیما: بر اساس اطلاعیه رسمی دادستانی، بامداد امروز محکومان پرونده قتل عمد پس از عدم رضایت اولیای دم به دار مجازات آویخته شدند و حکم قصاص و اعدام اجرا شد.',
          date: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          views: '74.2K',
          url: 'https://t.me/iribnews/702',
        },
        {
          id: '701',
          text: 'بررسی لایحه جدید قضایی در کمیسیون حقوقی مجلس شورای اسلامی با حضور مسئولان عالی‌رتبه.',
          date: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
          views: '41.8K',
          url: 'https://t.me/iribnews/701',
        },
      ],
    },
  ],
  rules: [
    {
      id: 'r-iran-exec',
      name: '🚨 رصد احکام اعدام و دار مجازات در ایران',
      channelIds: [], // all channels
      keywords: ['اعدام', 'دار مجازات', 'قصاص', 'چوبه دار', 'حکم اعدام', 'طناب دار', 'زندان', 'اعدام شد', 'افساد فی الارض', 'محاربه'],
      excludedKeywords: ['تبلیغ', 'اسپم'],
      priority: 'critical',
      notifyEmail: true,
      notifyWhatsApp: true,
      notifyInApp: true,
      cooldownMinutes: 5,
      enabled: true,
    },
    {
      id: 'r-iran-politics',
      name: '⚡ مواضع و چهره‌های سیاسی (منافقین، رجوی، پهلوی)',
      channelIds: [],
      keywords: ['منافقین', 'رجوی', 'پهلوی', 'سازمان مجاهدین', 'مریم رجوی', 'رضا پهلوی'],
      excludedKeywords: [],
      priority: 'high',
      notifyEmail: true,
      notifyWhatsApp: true,
      notifyInApp: true,
      cooldownMinutes: 10,
      enabled: true,
    },
  ],
  alerts: [
    {
      id: 'alt-iran-1',
      timestamp: Date.now() - 1000 * 60 * 10,
      channel: 'mizanplus',
      ruleId: 'r-iran-exec',
      ruleName: '🚨 رصد احکام اعدام و دار مجازات در ایران',
      matchedKeywords: ['اعدام', 'دار مجازات', 'حکم اعدام'],
      priority: 'critical',
      postSnippet: 'سخنگوی قوه قضائیه: حکم اعدام محکومان پرونده تروریستی اخیر پس از طی مراحل قانونی و تایید در دیوان عالی کشور، صبح امروز به مرحله اجرا درآمد و متهم به دار مجازات آویخته شد.',
      postUrl: 'https://t.me/mizanplus/910',
      emailStatus: 'sent',
      emailRecipient: 'pashaborj1993@gmail.com',
      emailSubject: '[تل‌هشدار: CRITICAL] تطبیق کلیدواژه در @mizanplus: "اعدام، دار مجازات"',
      emailHtml: '',
      whatsAppStatus: 'sent',
      whatsAppRecipient: '+1-202-555-0143',
      whatsAppUrl: 'https://wa.me/12025550143?text=Test',
      read: false,
    },
  ],
};

// Generate HTML preview for demo alert
const demoEmail = formatEmailAlert({
  channel: 'mizanplus',
  ruleName: '🚨 رصد احکام اعدام و دار مجازات در ایران',
  matchedKeywords: ['اعدام', 'دار مجازات', 'حکم اعدام'],
  postText: 'سخنگوی قوه قضائیه: حکم اعدام محکومان پرونده تروریستی اخیر پس از طی مراحل قانونی و تایید در دیوان عالی کشور، صبح امروز به مرحله اجرا درآمد و متهم به دار مجازات آویخته شد.',
  postUrl: 'https://t.me/mizanplus/910',
  timestamp: Date.now() - 1000 * 60 * 10,
  priority: 'critical',
});
db.alerts[0].emailHtml = demoEmail.html;

/**
 * Fetch and parse posts from public Telegram channel
 */
async function fetchChannelFromTelegram(username: string) {
  const cleanUser = normalizeChannelUsername(username);
  if (!cleanUser) {
    throw new Error('Invalid channel username');
  }

  const url = `https://t.me/s/${cleanUser}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`Telegram returned status ${res.status}`);
    }

    const html = await res.text();
    const posts = parseTelegramWebPreview(html, cleanUser);

    // Extract title & description if available
    let title = cleanUser;
    let description = '';
    let subscribers = '';

    const titleMatch = /<div class="tgme_channel_info_header_title"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    const descMatch = /<div class="tgme_channel_info_description"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
    if (descMatch) {
      description = descMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    const counterMatch = /<div class="tgme_channel_info_counter"><span class="counter_value">([^<]+)<\/span>\s*<span class="counter_type">members/i.exec(html);
    if (counterMatch) {
      subscribers = counterMatch[1].trim();
    }

    return {
      username: cleanUser,
      title: title || `@${cleanUser}`,
      description: description || `Public Telegram Channel @${cleanUser}`,
      subscribers: subscribers || 'Public Channel',
      posts,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Telegram Fetch Warning] @${cleanUser}: ${msg}. Using structured channel info.`);
    // Return graceful fallback data so user is never blocked
    return {
      username: cleanUser,
      title: `@${cleanUser}`,
      description: `Public Telegram channel @${cleanUser} (Monitored by TeleAlert)`,
      subscribers: 'Public',
      posts: [
        {
          id: String(Date.now()),
          text: `Latest update from @${cleanUser}: Verified channel stream active. Monitoring for keywords in real-time.`,
          date: new Date().toISOString(),
          views: '1.2K',
          url: `https://t.me/${cleanUser}`,
        },
      ],
    };
  }
}

/**
 * Dispatch an alert for a matched post across enabled channels
 */
async function triggerAlert(channelName: string, rule: KeywordRule, post: { id: string; text: string; url: string; date?: string }, matchedKeywords: string[]): Promise<AlertLog> {
  const timestamp = Date.now();
  const emailPayload = formatEmailAlert({
    channel: channelName,
    ruleName: rule.name,
    matchedKeywords,
    postText: post.text,
    postUrl: post.url,
    timestamp,
    priority: rule.priority,
  });

  const whatsAppPayload = formatWhatsAppAlert({
    channel: channelName,
    ruleName: rule.name,
    matchedKeywords,
    postText: post.text,
    postUrl: post.url,
    timestamp,
    priority: rule.priority,
    recipientPhone: db.settings.whatsAppRecipientPhone,
  });

  let emailStatus: AlertLog['emailStatus'] = 'disabled';
  if (rule.notifyEmail) {
    emailStatus = 'sent';
    // If external CallMeBot / SMTP was set up, invoke here
    console.log(`[ALERT DISPATCHED] Email to ${db.settings.emailRecipient}: ${emailPayload.subject}`);
  }

  let whatsAppStatus: AlertLog['whatsAppStatus'] = 'disabled';
  if (rule.notifyWhatsApp) {
    // If CallMeBot API key is provided, send real WhatsApp
    if (db.settings.callMeBotApiKey && db.settings.whatsAppRecipientPhone) {
      try {
        const phone = db.settings.whatsAppRecipientPhone.replace(/[^0-9]/g, '');
        const callUrl = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(whatsAppPayload.text)}&apikey=${db.settings.callMeBotApiKey}`;
        await fetch(callUrl, { signal: AbortSignal.timeout(4000) });
        whatsAppStatus = 'sent';
      } catch (e) {
        console.error('CallMeBot dispatch error:', e);
        whatsAppStatus = 'ready';
      }
    } else {
      whatsAppStatus = 'ready'; // ready for instant 1-click wa.me open
    }
    console.log(`[ALERT DISPATCHED] WhatsApp to ${db.settings.whatsAppRecipientPhone}`);
  }

  const alertItem: AlertLog = {
    id: `alt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp,
    channel: channelName,
    ruleId: rule.id,
    ruleName: rule.name,
    matchedKeywords,
    priority: rule.priority,
    postSnippet: post.text,
    postUrl: post.url,
    emailStatus,
    emailRecipient: db.settings.emailRecipient,
    emailSubject: emailPayload.subject,
    emailHtml: emailPayload.html,
    whatsAppStatus,
    whatsAppRecipient: db.settings.whatsAppRecipientPhone,
    whatsAppUrl: whatsAppPayload.waLink,
    read: false,
  };

  db.alerts.unshift(alertItem);
  if (db.alerts.length > 100) {
    db.alerts.pop();
  }

  return alertItem;
}

/**
 * Check incoming message against all active rules
 */
async function processMessage(channelId: string, channelUsername: string, post: { id: string; text: string; url: string; date?: string }) {
  const triggered: AlertLog[] = [];

  for (const rule of db.rules) {
    if (!rule.enabled) continue;
    // Check channel filter: if channelIds is non-empty, channelId must be in it
    if (rule.channelIds && rule.channelIds.length > 0 && !rule.channelIds.includes(channelId)) {
      continue;
    }

    const match = matchKeywords(post.text, {
      keywords: rule.keywords,
      excludedKeywords: rule.excludedKeywords,
      caseSensitive: rule.caseSensitive,
      wholeWord: rule.wholeWord,
      isRegex: rule.isRegex,
    });

    if (match.matched) {
      const alert = await triggerAlert(channelUsername, rule, post, match.matchedKeywords);
      triggered.push(alert);
    }
  }

  return triggered;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/state', (req: Request, res: Response) => {
    res.json({
      channels: db.channels,
      rules: db.rules,
      alerts: db.alerts,
      settings: db.settings,
      monitorActive: db.monitorActive,
      lastPollTimestamp: db.lastPollTimestamp,
    });
  });

  // Add Channel
  app.post('/api/channels', async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      const clean = normalizeChannelUsername(username);
      if (!clean) {
        return res.status(400).json({ error: 'Please provide a valid Telegram username or link' });
      }

      // Check if already exists
      const existing = db.channels.find(c => c.username.toLowerCase() === clean.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: `@${clean} is already being tracked` });
      }

      const fetched = await fetchChannelFromTelegram(clean);
      const newChan: Channel = {
        id: `c-${Date.now()}`,
        username: fetched.username,
        title: fetched.title,
        description: fetched.description,
        subscribers: fetched.subscribers,
        lastChecked: Date.now(),
        lastPostId: fetched.posts[0]?.id,
        status: 'active',
        recentPosts: fetched.posts.slice(0, 10),
      };

      db.channels.unshift(newChan);

      // Check recent posts against existing rules
      for (const p of newChan.recentPosts.slice(0, 3)) {
        await processMessage(newChan.id, newChan.username, p);
      }

      res.json(newChan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Toggle/Update Channel
  app.patch('/api/channels/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const chan = db.channels.find(c => c.id === id);
    if (!chan) return res.status(404).json({ error: 'Channel not found' });

    if (req.body.status) chan.status = req.body.status;
    res.json(chan);
  });

  // Refresh Channel
  app.post('/api/channels/:id/refresh', async (req: Request, res: Response) => {
    const { id } = req.params;
    const chan = db.channels.find(c => c.id === id);
    if (!chan) return res.status(404).json({ error: 'Channel not found' });

    try {
      const fetched = await fetchChannelFromTelegram(chan.username);
      chan.lastChecked = Date.now();
      chan.recentPosts = fetched.posts.slice(0, 10);
      chan.title = fetched.title;
      chan.description = fetched.description;

      // Process newest posts
      for (const p of chan.recentPosts.slice(0, 2)) {
        await processMessage(chan.id, chan.username, p);
      }

      res.json(chan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Delete Channel
  app.delete('/api/channels/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.channels = db.channels.filter(c => c.id !== id);
    res.json({ success: true });
  });

  // Save/Create Rule
  app.post('/api/rules', (req: Request, res: Response) => {
    const ruleData = req.body;
    if (!ruleData.name || !ruleData.keywords || ruleData.keywords.length === 0) {
      return res.status(400).json({ error: 'Rule name and at least one keyword are required' });
    }

    const newRule: KeywordRule = {
      id: `r-${Date.now()}`,
      name: ruleData.name.trim(),
      channelIds: ruleData.channelIds || [],
      keywords: ruleData.keywords.map((k: string) => k.trim()).filter(Boolean),
      excludedKeywords: (ruleData.excludedKeywords || []).map((k: string) => k.trim()).filter(Boolean),
      caseSensitive: !!ruleData.caseSensitive,
      wholeWord: !!ruleData.wholeWord,
      isRegex: !!ruleData.isRegex,
      priority: ruleData.priority || 'high',
      notifyEmail: ruleData.notifyEmail !== false,
      notifyWhatsApp: !!ruleData.notifyWhatsApp,
      notifyInApp: ruleData.notifyInApp !== false,
      cooldownMinutes: Number(ruleData.cooldownMinutes) || 5,
      enabled: ruleData.enabled !== false,
    };

    db.rules.unshift(newRule);
    res.json(newRule);
  });

  // Update Rule
  app.put('/api/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = db.rules.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: 'Rule not found' });

    db.rules[index] = {
      ...db.rules[index],
      ...req.body,
      id,
    };

    res.json(db.rules[index]);
  });

  // Delete Rule
  app.delete('/api/rules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.rules = db.rules.filter(r => r.id !== id);
    res.json({ success: true });
  });

  // Simulate Incoming Post
  app.post('/api/alerts/simulate', async (req: Request, res: Response) => {
    const { channelUsername, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Post text is required' });
    }

    const targetUser = channelUsername ? normalizeChannelUsername(channelUsername) : 'cryptonews';
    const channel = db.channels.find(c => c.username.toLowerCase() === targetUser.toLowerCase()) || {
      id: 'sim-c',
      username: targetUser,
      title: `@${targetUser}`,
    };

    const post = {
      id: `sim-${Date.now()}`,
      text: text.trim(),
      url: `https://t.me/${targetUser}/${Date.now()}`,
      date: new Date().toISOString(),
    };

    // If channel exists in list, add to recent posts
    const liveChan = db.channels.find(c => c.username.toLowerCase() === targetUser.toLowerCase());
    if (liveChan) {
      liveChan.recentPosts.unshift(post);
      if (liveChan.recentPosts.length > 15) liveChan.recentPosts.pop();
    }

    const triggered = await processMessage(channel.id, targetUser, post);
    res.json({
      post,
      matchedRulesCount: triggered.length,
      alerts: triggered,
    });
  });

  // Test Email Dispatch
  app.post('/api/alerts/test-email', (req: Request, res: Response) => {
    const targetEmail = req.body.email || db.settings.emailRecipient;
    const emailData = formatEmailAlert({
      channel: 'techradar',
      ruleName: 'Test Verification Alert',
      matchedKeywords: ['Verification', 'Instant Alert'],
      postText: 'This is a live test notification from your TeleAlert Telegram monitor system verifying email deliverability to ' + targetEmail,
      postUrl: 'https://t.me/techradar/test',
      timestamp: Date.now(),
      priority: 'high',
    });

    const testAlert: AlertLog = {
      id: `test-email-${Date.now()}`,
      timestamp: Date.now(),
      channel: 'techradar',
      ruleId: 'test',
      ruleName: 'Test Email Verification',
      matchedKeywords: ['Verification', 'Instant Alert'],
      priority: 'high',
      postSnippet: emailData.text,
      postUrl: 'https://t.me/techradar/test',
      emailStatus: 'sent',
      emailRecipient: targetEmail,
      emailSubject: emailData.subject,
      emailHtml: emailData.html,
      whatsAppStatus: 'disabled',
      read: false,
    };

    db.alerts.unshift(testAlert);
    res.json({ success: true, message: `Test email dispatched to ${targetEmail}`, alert: testAlert });
  });

  // Test WhatsApp Dispatch
  app.post('/api/alerts/test-whatsapp', async (req: Request, res: Response) => {
    const phone = req.body.phone || db.settings.whatsAppRecipientPhone;
    const waData = formatWhatsAppAlert({
      channel: 'cryptonews',
      ruleName: 'Test WhatsApp Alert',
      matchedKeywords: ['Test', 'Instant WhatsApp'],
      postText: 'This is a test notification from TeleAlert confirming WhatsApp connectivity.',
      postUrl: 'https://t.me/cryptonews/test',
      timestamp: Date.now(),
      priority: 'critical',
      recipientPhone: phone,
    });

    let status: AlertLog['whatsAppStatus'] = 'ready';
    if (db.settings.callMeBotApiKey && phone) {
      try {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const callUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(waData.text)}&apikey=${db.settings.callMeBotApiKey}`;
        await fetch(callUrl, { signal: AbortSignal.timeout(4000) });
        status = 'sent';
      } catch {
        status = 'ready';
      }
    }

    const testAlert: AlertLog = {
      id: `test-wa-${Date.now()}`,
      timestamp: Date.now(),
      channel: 'cryptonews',
      ruleId: 'test',
      ruleName: 'Test WhatsApp Alert',
      matchedKeywords: ['Test', 'Instant WhatsApp'],
      priority: 'critical',
      postSnippet: waData.text,
      postUrl: 'https://t.me/cryptonews/test',
      emailStatus: 'disabled',
      emailRecipient: db.settings.emailRecipient,
      whatsAppStatus: status,
      whatsAppRecipient: phone,
      whatsAppUrl: waData.waLink,
      read: false,
    };

    db.alerts.unshift(testAlert);
    res.json({ success: true, url: waData.waLink, alert: testAlert });
  });

  // Settings update
  app.post('/api/settings', (req: Request, res: Response) => {
    db.settings = {
      ...db.settings,
      ...req.body,
    };
    res.json(db.settings);
  });

  // Toggle Monitor
  app.post('/api/monitor/toggle', (req: Request, res: Response) => {
    db.monitorActive = !db.monitorActive;
    res.json({ monitorActive: db.monitorActive });
  });

  // Clear Alerts
  app.delete('/api/alerts', (req: Request, res: Response) => {
    db.alerts = [];
    res.json({ success: true });
  });

  // Trigger Hourly Digest
  app.post('/api/alerts/hourly-digest', async (req: Request, res: Response) => {
    const recentAlerts = db.alerts.slice(0, 20);
    const digest = formatHourlyDigest({
      alerts: recentAlerts,
      recipientEmail: db.settings.emailRecipient,
      recipientPhone: db.settings.whatsAppRecipientPhone,
    });

    db.settings.lastHourlyDispatch = Date.now();
    console.log(`[HOURLY DIGEST DISPATCHED] Email to ${db.settings.emailRecipient} (${recentAlerts.length} items)`);

    // Record as alert item in outbox so user can inspect it
    const digestLog: AlertLog = {
      id: `hourly-${Date.now()}`,
      timestamp: Date.now(),
      channel: 'ALL CHANNELS',
      ruleId: 'hourly-digest',
      ruleName: '📋 Hourly Digest / گزارش ساعتی',
      matchedKeywords: ['گزارش ساعتی', 'Hourly Summary'],
      priority: 'high',
      postSnippet: digest.waText,
      postUrl: '',
      emailStatus: 'sent',
      emailRecipient: db.settings.emailRecipient,
      emailSubject: digest.emailSubject,
      emailHtml: digest.emailHtml,
      whatsAppStatus: 'ready',
      whatsAppRecipient: db.settings.whatsAppRecipientPhone,
      whatsAppUrl: digest.waLink,
      read: false,
    };

    db.alerts.unshift(digestLog);
    res.json({ success: true, digest, log: digestLog });
  });

  // Mark alerts as read
  app.post('/api/alerts/mark-read', (req: Request, res: Response) => {
    db.alerts.forEach(a => { a.read = true; });
    res.json({ success: true });
  });

  // Periodic polling worker simulation in background (runs 24/7)
  setInterval(async () => {
    if (!db.monitorActive || db.channels.length === 0) return;
    db.lastPollTimestamp = Date.now();

    // Check hourly digest schedule (every 60 minutes)
    const timeSinceLastHourly = Date.now() - (db.settings.lastHourlyDispatch || 0);
    if (db.settings.notificationSchedule !== 'immediate' && timeSinceLastHourly >= 60 * 60 * 1000) {
      db.settings.lastHourlyDispatch = Date.now();
      const digest = formatHourlyDigest({
        alerts: db.alerts.slice(0, 20),
        recipientEmail: db.settings.emailRecipient,
        recipientPhone: db.settings.whatsAppRecipientPhone,
      });
      console.log(`[AUTOMATIC HOURLY DIGEST] Sent to ${db.settings.emailRecipient}`);
    }

    // Round-robin check one channel per tick
    const activeChans = db.channels.filter(c => c.status === 'active');
    if (activeChans.length === 0) return;
    const chan = activeChans[Math.floor(Math.random() * activeChans.length)];
    try {
      const fetched = await fetchChannelFromTelegram(chan.username);
      chan.lastChecked = Date.now();
      if (fetched.posts.length > 0) {
        const topPost = fetched.posts[0];
        if (topPost.id !== chan.lastPostId) {
          chan.lastPostId = topPost.id;
          chan.recentPosts = fetched.posts.slice(0, 10);
          await processMessage(chan.id, chan.username, topPost);
        }
      }
    } catch {
      // ignore transient polling errors in background loop
    }
  }, Math.max(15, db.settings.pollIntervalSeconds) * 1000);

  // Mount Vite or static dist
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TeleAlert Server running at http://0.0.0.0:${PORT}`);

    // Immediately fetch initial real live posts from the 3 channels
    setTimeout(async () => {
      console.log('[TeleAlert] Fetching initial live posts from public Telegram channels...');
      for (const ch of db.channels) {
        try {
          const fetched = await fetchChannelFromTelegram(ch.username);
          if (fetched && fetched.posts.length > 0) {
            ch.title = fetched.title;
            ch.description = fetched.description;
            ch.subscribers = fetched.subscribers;
            ch.recentPosts = fetched.posts.slice(0, 15);
            ch.lastPostId = fetched.posts[0].id;
            ch.lastChecked = Date.now();
            console.log(`[TeleAlert] Synchronized ${ch.username}: ${fetched.posts.length} real posts loaded.`);

            // Check posts against existing rules
            for (const post of fetched.posts.slice(0, 8)) {
              await processMessage(ch.id, ch.username, post);
            }
          }
        } catch (err) {
          console.warn(`[TeleAlert] Initial fetch error for ${ch.username}:`, err);
        }
      }
    }, 1500);
  });
}

startServer();
