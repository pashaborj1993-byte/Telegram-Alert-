import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase.ts';
import { Channel, KeywordRule, AlertLog, AppSettings } from '../types.ts';

// Default templates for a new user
export const DEFAULT_CHANNELS: Omit<Channel, 'id'>[] = [
  {
    username: 'mizanplus',
    webUrl: 'https://t.me/mizanplus',
    title: 'خبرگزاری میزان (قوه قضائیه)',
    description: 'خبرگزاری رسمی مرکز رسانه قوه قضائیه - پوشش احکام دادگاه‌ها، پرونده‌های کیفری و احکام اعدام و دار مجازات در ایران',
    subscribers: '185K',
    lastChecked: Date.now(),
    status: 'active',
    recentPosts: [],
  },
  {
    username: 'FarsNA',
    webUrl: 'https://t.me/FarsNA',
    title: 'خبرگزاری فارس',
    description: 'خبرگزاری فارس - پوشش اخبار سیاسی، امنیتی، مواضع چهره‌های سیاسی و تحولات داخلی ایران',
    subscribers: '420K',
    lastChecked: Date.now(),
    status: 'active',
    recentPosts: [],
  },
  {
    username: 'iribnews',
    webUrl: 'https://t.me/iribnews',
    title: 'خبرگزاری صداوسیما',
    description: 'خبرگزاری رسمی صدا و سیمای جمهوری اسلامی ایران - پوشش گزارش‌های خبری، بیانیه‌ها و رویدادهای ملی',
    subscribers: '590K',
    lastChecked: Date.now(),
    status: 'active',
    recentPosts: [],
  },
];

export const DEFAULT_RULES: Omit<KeywordRule, 'id'>[] = [
  {
    name: '🚨 رصد احکام اعدام و دار مجازات در ایران',
    channelIds: [],
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
];

export async function getUserSettings(userId: string, defaultEmail?: string): Promise<AppSettings> {
  const ref = doc(db, 'users', userId, 'settings', 'config');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as AppSettings;
  }

  const defaultSettings: AppSettings = {
    language: 'fa',
    notificationSchedule: 'hourly',
    lastHourlyDispatch: Date.now() - 1000 * 60 * 30,
    emailRecipient: defaultEmail || '',
    smtpConfigured: false,
    whatsAppRecipientPhone: '+1-202-555-0143',
    callMeBotApiKey: '',
    pollIntervalSeconds: 30,
    soundEnabled: true,
    desktopNotifications: true,
  };
  await setDoc(ref, defaultSettings);
  return defaultSettings;
}

export async function saveUserSettings(userId: string, settings: AppSettings): Promise<void> {
  const ref = doc(db, 'users', userId, 'settings', 'config');
  await setDoc(ref, settings, { merge: true });
}

export async function getUserChannels(userId: string): Promise<Channel[]> {
  const colRef = collection(db, 'users', userId, 'channels');
  const snap = await getDocs(colRef);
  if (snap.empty) {
    // Seed default channels for new user
    const seeded: Channel[] = [];
    for (let i = 0; i < DEFAULT_CHANNELS.length; i++) {
      const def = DEFAULT_CHANNELS[i];
      const id = `c-${def.username}-${Date.now()}-${i}`;
      const item: Channel = { ...def, id };
      await setDoc(doc(db, 'users', userId, 'channels', id), item);
      seeded.push(item);
    }
    return seeded;
  }
  return snap.docs.map(d => d.data() as Channel);
}

export async function saveUserChannel(userId: string, channel: Channel): Promise<void> {
  const ref = doc(db, 'users', userId, 'channels', channel.id);
  await setDoc(ref, channel, { merge: true });
}

export async function deleteUserChannel(userId: string, channelId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'channels', channelId);
  await deleteDoc(ref);
}

export async function getUserRules(userId: string): Promise<KeywordRule[]> {
  const colRef = collection(db, 'users', userId, 'rules');
  const snap = await getDocs(colRef);
  if (snap.empty) {
    // Seed default rules for new user
    const seeded: KeywordRule[] = [];
    for (let i = 0; i < DEFAULT_RULES.length; i++) {
      const def = DEFAULT_RULES[i];
      const id = `r-rule-${Date.now()}-${i}`;
      const item: KeywordRule = { ...def, id };
      await setDoc(doc(db, 'users', userId, 'rules', id), item);
      seeded.push(item);
    }
    return seeded;
  }
  return snap.docs.map(d => d.data() as KeywordRule);
}

export async function saveUserRule(userId: string, rule: KeywordRule): Promise<void> {
  const ref = doc(db, 'users', userId, 'rules', rule.id);
  await setDoc(ref, rule, { merge: true });
}

export async function deleteUserRule(userId: string, ruleId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'rules', ruleId);
  await deleteDoc(ref);
}

export async function getUserAlerts(userId: string): Promise<AlertLog[]> {
  const colRef = collection(db, 'users', userId, 'alerts');
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AlertLog);
}

export async function saveUserAlert(userId: string, alert: AlertLog): Promise<void> {
  const ref = doc(db, 'users', userId, 'alerts', alert.id);
  await setDoc(ref, alert);
}

export async function clearUserAlerts(userId: string): Promise<void> {
  const colRef = collection(db, 'users', userId, 'alerts');
  const snap = await getDocs(colRef);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
}
