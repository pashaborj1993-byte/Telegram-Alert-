/**
 * Pure utility functions for Telegram channel post parsing, keyword matching,
 * Persian & Arabic text normalization, exclusionary negative filtering,
 * and immediate / hourly notification payload generation.
 */

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

export interface MatchResult {
  matched: boolean;
  matchedKeywords: string[];
  excludedTrigger?: string;
  reason?: string;
}

/**
 * Normalizes Persian and Arabic text:
 * - Unifies Yeh (ي / ى -> ی)
 * - Unifies Kaf (ك -> ک)
 * - Strips zero-width non-joiner (ZWNJ \u200c) for flexible phrase matching
 * - Strips Arabic diacritics / Tanween / Tashdeed (َ ِ ُ ً ٍ ٌ ّ ْ)
 * - Normalizes Persian / Arabic numerals
 */
export function normalizePersianText(str: string): string {
  if (!str) return '';
  let res = str;

  // Unify Arabic Yeh to Persian Yeh
  res = res.replace(/[\u064A\u0649]/g, '\u06CC');

  // Unify Arabic Kaf to Persian Kaf
  res = res.replace(/\u0643/g, '\u06A9');

  // Remove Arabic diacritics / Harakat
  res = res.replace(/[\u064B-\u065F\u0670]/g, '');

  // Remove zero-width non-joiner (نیم‌فاصله) for phrase matching
  res = res.replace(/[\u200C\u200D\u200E\u200F]/g, ' ');

  // Collapse multiple whitespaces
  res = res.replace(/\s+/g, ' ');

  return res.trim();
}

/**
 * Splits keywords input by both English comma (,) and Persian/Arabic comma (،)
 */
export function splitKeywords(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[,،\n]+/)
    .map(k => k.trim())
    .filter(Boolean);
}

export const KNOWN_CHANNEL_MAPPINGS: Record<string, { handle: string; title: string; defaultUrl: string }> = {
  '-1001006939659': { handle: 'mizanplus', title: 'خبرگزاری میزان (قوه قضائیه)', defaultUrl: 'https://t.me/mizanplus' },
  '1006939659': { handle: 'mizanplus', title: 'خبرگزاری میزان (قوه قضائیه)', defaultUrl: 'https://t.me/mizanplus' },
  'mizanplus': { handle: 'mizanplus', title: 'خبرگزاری میزان (قوه قضائیه)', defaultUrl: 'https://t.me/mizanplus' },
  'mizanpress': { handle: 'mizanplus', title: 'خبرگزاری میزان (قوه قضائیه)', defaultUrl: 'https://t.me/mizanplus' },
  'mizan': { handle: 'mizanplus', title: 'خبرگزاری میزان (قوه قضائیه)', defaultUrl: 'https://t.me/mizanplus' },
  '-1001275084443': { handle: 'FarsNA', title: 'خبرگزاری فارس', defaultUrl: 'https://t.me/FarsNA' },
  '1275084443': { handle: 'FarsNA', title: 'خبرگزاری فارس', defaultUrl: 'https://t.me/FarsNA' },
  'farsna': { handle: 'FarsNA', title: 'خبرگزاری فارس', defaultUrl: 'https://t.me/FarsNA' },
  'FarsNA': { handle: 'FarsNA', title: 'خبرگزاری فارس', defaultUrl: 'https://t.me/FarsNA' },
  'fars': { handle: 'FarsNA', title: 'خبرگزاری فارس', defaultUrl: 'https://t.me/FarsNA' },
  '-1001004576149': { handle: 'iribnews', title: 'خبرگزاری صداوسیما', defaultUrl: 'https://t.me/iribnews' },
  '1004576149': { handle: 'iribnews', title: 'خبرگزاری صداوسیما', defaultUrl: 'https://t.me/iribnews' },
  'iribnews': { handle: 'iribnews', title: 'خبرگزاری صداوسیما', defaultUrl: 'https://t.me/iribnews' },
  'irib': { handle: 'iribnews', title: 'خبرگزاری صداوسیما', defaultUrl: 'https://t.me/iribnews' },
};

/**
 * Normalizes user input into a clean Telegram channel username or ID.
 * Supports:
 * - https://web.telegram.org/a/#-1001006939659 -> mizanplus / -1001006939659
 * - https://t.me/mizanplus -> mizanplus
 * - https://t.me/FarsNA -> FarsNA
 * - https://t.me/iribnews -> iribnews
 * - @mizanplus -> mizanplus
 */
export function normalizeChannelUsername(input: string): string {
  if (!input) return '';
  let cleaned = input.trim();

  // If it's a web.telegram.org URL (e.g. https://web.telegram.org/a/#-1001006939659)
  const webMatch = /web\.telegram\.org\/(?:[ak])\/#([^\/\?&]+)/i.exec(cleaned);
  if (webMatch) {
    const rawId = webMatch[1].trim();
    if (KNOWN_CHANNEL_MAPPINGS[rawId]) {
      return KNOWN_CHANNEL_MAPPINGS[rawId].handle;
    }
    return rawId;
  }

  // If it contains t.me/c/1006939659 or t.me/c/-1001006939659
  const cMatch = /t\.me\/c\/(-?\d+)/i.exec(cleaned);
  if (cMatch) {
    const id = cMatch[1];
    const normalizedId = id.startsWith('-100') ? id : `-100${id}`;
    if (KNOWN_CHANNEL_MAPPINGS[normalizedId]) {
      return KNOWN_CHANNEL_MAPPINGS[normalizedId].handle;
    }
    return normalizedId;
  }

  // Strip url parts: https://t.me/channel_name, t.me/channel_name, telegram.me/channel_name
  cleaned = cleaned.replace(/^(https?:\/\/)?(t\.me|telegram\.me)\/(s\/)?/i, '');

  // Strip leading @
  cleaned = cleaned.replace(/^@/, '');

  // Strip any trailing slashes or queries
  cleaned = cleaned.split('/')[0].split('?')[0].trim();

  if (KNOWN_CHANNEL_MAPPINGS[cleaned]) {
    return KNOWN_CHANNEL_MAPPINGS[cleaned].handle;
  }
  if (KNOWN_CHANNEL_MAPPINGS[cleaned.toLowerCase()]) {
    return KNOWN_CHANNEL_MAPPINGS[cleaned.toLowerCase()].handle;
  }

  return cleaned;
}

/**
 * Evaluates whether post text matches the keyword rule criteria.
 * Integrates Persian text normalization for accurate matching across script variants.
 */
export function matchKeywords(
  text: string,
  options: {
    keywords: string[];
    excludedKeywords?: string[];
    caseSensitive?: boolean;
    wholeWord?: boolean;
    isRegex?: boolean;
  }
): MatchResult {
  if (!text || !options.keywords || options.keywords.length === 0) {
    return { matched: false, matchedKeywords: [] };
  }

  const {
    keywords,
    excludedKeywords = [],
    caseSensitive = false,
    wholeWord = false,
    isRegex = false,
  } = options;

  const rawSearchText = caseSensitive ? text : text.toLowerCase();
  const normalizedSearchText = normalizePersianText(rawSearchText);

  // 1. Check exclusionary / negative keywords first: if present, match is cancelled
  for (const rawEx of excludedKeywords) {
    const ex = rawEx.trim();
    if (!ex) continue;
    const targetEx = caseSensitive ? ex : ex.toLowerCase();
    const normalizedEx = normalizePersianText(targetEx);

    if (wholeWord) {
      const regex = new RegExp(`(^|\\s|[.,!?;:،])(${escapeRegExp(targetEx)}|${escapeRegExp(normalizedEx)})($|\\s|[.,!?;:،])`, caseSensitive ? '' : 'i');
      if (regex.test(text) || regex.test(normalizedSearchText)) {
        return { matched: false, matchedKeywords: [], excludedTrigger: ex, reason: `Excluded by keyword: "${ex}"` };
      }
    } else {
      if (rawSearchText.includes(targetEx) || normalizedSearchText.includes(normalizedEx)) {
        return { matched: false, matchedKeywords: [], excludedTrigger: ex, reason: `Excluded by keyword: "${ex}"` };
      }
    }
  }

  // 2. Check positive keywords
  const matchedKeywords: string[] = [];

  for (const rawKw of keywords) {
    const kw = rawKw.trim();
    if (!kw) continue;

    if (isRegex) {
      try {
        const regex = new RegExp(kw, caseSensitive ? '' : 'i');
        if (regex.test(text) || regex.test(normalizedSearchText)) {
          matchedKeywords.push(kw);
        }
      } catch {
        // invalid regex, ignore or treat as plain text
      }
    } else if (wholeWord) {
      const targetKw = caseSensitive ? kw : kw.toLowerCase();
      const normalizedKw = normalizePersianText(targetKw);
      const regex = new RegExp(`(^|\\s|[.,!?;:،])(${escapeRegExp(targetKw)}|${escapeRegExp(normalizedKw)})($|\\s|[.,!?;:،])`, caseSensitive ? '' : 'i');
      if (regex.test(text) || regex.test(normalizedSearchText)) {
        matchedKeywords.push(kw);
      }
    } else {
      const targetKw = caseSensitive ? kw : kw.toLowerCase();
      const normalizedKw = normalizePersianText(targetKw);
      if (rawSearchText.includes(targetKw) || normalizedSearchText.includes(normalizedKw)) {
        matchedKeywords.push(kw);
      }
    }
  }

  return {
    matched: matchedKeywords.length > 0,
    matchedKeywords,
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formats an Email notification message with HTML and plain text (bilingual support)
 */
export function formatEmailAlert(payload: {
  channel: string;
  ruleName: string;
  matchedKeywords: string[];
  postText: string;
  postUrl: string;
  timestamp: number;
  priority: string;
}): { subject: string; html: string; text: string } {
  const dateStr = new Date(payload.timestamp).toLocaleString();
  const kwList = payload.matchedKeywords.join('، ');
  const isPersianContent = /[\u0600-\u06FF]/.test(kwList + payload.postText);

  const subject = isPersianContent
    ? `[تل‌هشدار: ${payload.priority.toUpperCase()}] تطبیق کلیدواژه در @${payload.channel}: "${kwList}"`
    : `[TeleAlert: ${payload.priority.toUpperCase()}] Match on @${payload.channel}: "${kwList}"`;

  const highlightedText = highlightKeywordsInHtml(payload.postText, payload.matchedKeywords);

  const html = `
<!DOCTYPE html>
<html dir="${isPersianContent ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Vazirmatn', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; direction: ${isPersianContent ? 'rtl' : 'ltr'}; }
    .card { background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
    .header { border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 16px; text-align: ${isPersianContent ? 'right' : 'left'}; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .priority-critical { background: #ef4444; color: white; }
    .priority-high { background: #f97316; color: white; }
    .priority-medium { background: #3b82f6; color: white; }
    .priority-low { background: #64748b; color: white; }
    .channel { color: #38bdf8; font-weight: 600; font-size: 16px; text-decoration: none; }
    .post-body { background: #090d16; border-${isPersianContent ? 'right' : 'left'}: 4px solid #38bdf8; padding: 16px; border-radius: 6px; font-size: 14px; line-height: 1.8; white-space: pre-wrap; margin: 16px 0; color: #e2e8f0; text-align: ${isPersianContent ? 'right' : 'left'}; }
    .mark { background: #fef08a; color: #854d0e; font-weight: bold; padding: 1px 4px; border-radius: 3px; }
    .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; font-weight: 600; padding: 10px 20px; border-radius: 8px; margin-top: 12px; text-align: center; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge priority-${payload.priority.toLowerCase()}">${payload.priority}</span>
      <h2 style="margin: 8px 0 4px 0; color: #ffffff;">${isPersianContent ? 'هشدار کشف کلیدواژه' : 'Keyword Alert Triggered'}</h2>
      <div style="font-size: 13px; color: #94a3b8;">${isPersianContent ? 'قانون:' : 'Rule:'} <strong style="color: #cbd5e1;">${payload.ruleName}</strong> &bull; ${dateStr}</div>
    </div>
    <p style="margin: 0 0 8px 0;">${isPersianContent ? 'پیام جدید در کانال' : 'New message detected in channel'} <a class="channel" href="https://t.me/${payload.channel.replace(/^-100/, 'c/')}">${payload.channel}</a> ${isPersianContent ? 'منطبق با کلیدواژه‌ها:' : 'matching keywords:'}</p>
    <div style="margin-bottom: 12px;">
      ${payload.matchedKeywords.map(k => `<span style="background: #0284c7; color: white; font-size: 12px; padding: 3px 8px; border-radius: 4px; margin-${isPersianContent ? 'left' : 'right'}: 6px; display: inline-block; font-weight: 600;">${k}</span>`).join(' ')}
    </div>
    <div class="post-body">${highlightedText}</div>
    <div style="text-align: center;">
      <a class="btn" href="${payload.postUrl || `https://t.me/${payload.channel}`}" target="_blank">${isPersianContent ? 'مشاهده پست در تلگرام ←' : 'Open Telegram Post &rarr;'}</a>
    </div>
    <div class="footer">
      ${isPersianContent ? 'ارسال‌شده توسط رصدگر ۲۴ ساعته تل‌هشدار' : 'Sent immediately by TeleAlert Live Monitor'}
    </div>
  </div>
</body>
</html>
`.trim();

  const text = `
[${isPersianContent ? 'تل‌هشدار' : 'TeleAlert'}: ${payload.priority.toUpperCase()}]
${isPersianContent ? 'کانال:' : 'Channel:'} ${payload.channel}
${isPersianContent ? 'قانون:' : 'Rule:'} ${payload.ruleName}
${isPersianContent ? 'کلیدواژه‌های منطبق:' : 'Keywords Matched:'} ${kwList}
${isPersianContent ? 'زمان:' : 'Time:'} ${dateStr}

${isPersianContent ? 'متن پیام:' : 'Message:'}
${payload.postText}

${isPersianContent ? 'لینک پست:' : 'Link:'} ${payload.postUrl || `https://t.me/${payload.channel}`}
`.trim();

  return { subject, html, text };
}

/**
 * Formats a WhatsApp message alert with click-to-chat wa.me link generator
 */
export function formatWhatsAppAlert(payload: {
  channel: string;
  ruleName: string;
  matchedKeywords: string[];
  postText: string;
  postUrl: string;
  timestamp: number;
  priority: string;
  recipientPhone?: string;
}): { text: string; waLink: string } {
  const isPersian = /[\u0600-\u06FF]/.test(payload.matchedKeywords.join('') + payload.postText);
  const kwList = payload.matchedKeywords.join(isPersian ? '، ' : ', ');
  const priorityEmoji = payload.priority === 'critical' ? '🚨' : payload.priority === 'high' ? '⚡' : '🔔';

  const text = isPersian
    ? `${priorityEmoji} *هشدار تلگرام: ${payload.channel}*\n` +
      `*قانون:* ${payload.ruleName}\n` +
      `*کلیدواژه‌ها:* ${kwList}\n` +
      `*اولویت:* ${payload.priority.toUpperCase()}\n\n` +
      `*متن پیام:*\n"${payload.postText.length > 500 ? payload.postText.slice(0, 497) + '...' : payload.postText}"\n\n` +
      `🔗 *لینک مشاهده:* ${payload.postUrl || `https://t.me/${payload.channel}`}`
    : `${priorityEmoji} *TELEGRAM ALERT: ${payload.channel}*\n` +
      `*Rule:* ${payload.ruleName}\n` +
      `*Keywords:* ${kwList}\n` +
      `*Priority:* ${payload.priority.toUpperCase()}\n\n` +
      `*Message:*\n"${payload.postText.length > 500 ? payload.postText.slice(0, 497) + '...' : payload.postText}"\n\n` +
      `🔗 *View Post:* ${payload.postUrl || `https://t.me/${payload.channel}`}`;

  const cleanPhone = (payload.recipientPhone || '').replace(/[^0-9]/g, '');
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  return { text, waLink };
}

/**
 * Formats an Hourly Digest of all matching Telegram posts during the last hour
 */
export function formatHourlyDigest(payload: {
  alerts: Array<{
    id: string;
    channel: string;
    ruleName: string;
    matchedKeywords: string[];
    postSnippet: string;
    postUrl: string;
    timestamp: number;
    priority: string;
  }>;
  recipientEmail: string;
  recipientPhone?: string;
}): { emailSubject: string; emailHtml: string; waText: string; waLink: string } {
  const count = payload.alerts.length;
  const now = new Date();
  const dateFa = new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'full',
    timeStyle: 'medium',
    calendar: 'persian',
  }).format(now);
  const dateEn = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const emailSubject = `📋 [TeleAlert Report] ${count} Real-Time Keyword Alert(s) Detected • ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TeleAlert Executive Bulleted Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Vazirmatn', Tahoma, sans-serif; background-color: #0b0f19; color: #f1f5f9; margin: 0; padding: 24px 12px; }
    .container { max-width: 680px; margin: 0 auto; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .banner { background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%); padding: 24px; color: #ffffff; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); margin-bottom: 8px; }
    .title { font-size: 20px; font-weight: 800; margin: 0 0 6px 0; color: #ffffff; }
    .subtitle { font-size: 13px; opacity: 0.9; margin: 0; }
    .meta-bar { background-color: #030712; padding: 12px 20px; font-size: 12px; color: #9ca3af; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .content { padding: 24px 20px; }
    .intro-text { font-size: 14px; color: #cbd5e1; margin-bottom: 20px; line-height: 1.6; }
    .bullet-list { list-style: none; padding: 0; margin: 0; }
    .bullet-card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 16px; position: relative; }
    .bullet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 6px; }
    .channel-tag { font-weight: 700; font-size: 13px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.2); }
    .priority-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .priority-critical { background-color: rgba(244, 63, 94, 0.15); color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.3); }
    .priority-high { background-color: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
    .priority-medium { background-color: rgba(56, 189, 248, 0.15); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3); }
    .kw-pill { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 4px; background: #0284c7; color: #ffffff; margin-left: 4px; margin-bottom: 4px; }
    .bullet-text { font-size: 13px; line-height: 1.8; color: #e2e8f0; background: #0b1120; padding: 12px; border-radius: 8px; border-right: 3px solid #38bdf8; margin: 10px 0; white-space: pre-wrap; }
    .link-btn { display: inline-block; font-size: 12px; font-weight: 600; color: #38bdf8; text-decoration: none; padding: 4px 10px; background: rgba(56, 189, 248, 0.1); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3); margin-top: 4px; }
    .footer { background-color: #030712; padding: 16px 20px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1f2937; }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <span class="badge">🤖 خودکار • ۲۴ ساعته</span>
      <h1 class="title">📋 بولتن خلاصه هشدارهای تلگرام (TeleAlert Report)</h1>
      <p class="subtitle">رصد لحظه‌ای کانال‌های میزان (قوه قضائیه)، خبرگزاری فارس و صداوسیما</p>
    </div>

    <div class="meta-bar">
      <span>📅 <strong>تاریخ:</strong> ${dateFa} (${dateEn})</span>
      <span>🎯 <strong>تعداد موارد منطبق:</strong> ${count} مورد</span>
    </div>

    <div class="content">
      <p class="intro-text">
        سلام، گزارش هوشمند و بولتن دوره‌ای موارد کشف‌شده از کانال‌های خبری تلگرام به صورت دسته‌بندی‌شده و بولت‌وار آماده گردیده است. سیستم بدون نیاز به مداخله دستی، پیوسته این کانال‌ها را رصد و نتایج را ثبت می‌کند:
      </p>

      <ul class="bullet-list">
        ${payload.alerts.map((a, idx) => `
          <li class="bullet-card">
            <div class="bullet-header">
              <div>
                <span style="font-weight: bold; color: #94a3b8; margin-left: 6px;">#${idx + 1}</span>
                <span class="channel-tag">${a.channel.startsWith('-') ? a.channel : '@' + a.channel}</span>
                <span style="font-size: 12px; color: #94a3b8; margin-right: 8px;">(${a.ruleName})</span>
              </div>
              <span class="priority-badge priority-${a.priority}">
                ${a.priority.toUpperCase()}
              </span>
            </div>

            <div style="margin: 8px 0;">
              <span style="font-size: 11px; color: #94a3b8; margin-left: 6px;">🔑 کلیدواژه‌های ردیابی‌شده:</span>
              ${a.matchedKeywords.map(k => `<span class="kw-pill">${k}</span>`).join(' ')}
            </div>

            <div class="bullet-text">
              • ${highlightKeywordsInHtml(a.postSnippet, a.matchedKeywords)}
            </div>

            <div style="text-align: left; margin-top: 6px;">
              <a href="${a.postUrl}" target="_blank" rel="noopener noreferrer" class="link-btn">
                🔗 مشاهده مستقیم پست در تلگرام (${a.channel}) ←
              </a>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="footer">
      این گزارش به صورت کاملاً خودکار و بدون نیاز به کلیک فرستاده شده است.<br>
      گیرنده گزارش: <strong>${payload.recipientEmail}</strong> • تل‌هشدار TeleAlert
    </div>
  </div>
</body>
</html>
  `.trim();

  // Bulleted WhatsApp and Plain Text Format
  const bulletLines = payload.alerts.map((a, i) => {
    const kws = a.matchedKeywords.join(' • ');
    const snippetClean = a.postSnippet.replace(/\n+/g, ' ').slice(0, 180);
    return `• *#${i + 1} [${a.channel}]* (${a.priority.toUpperCase()})\n` +
      `  🔑 *کلیدواژه‌ها:* ${kws}\n` +
      `  📝 *متن خبر:* "${snippetClean}..."\n` +
      `  🔗 *پیوند تلگرام:* ${a.postUrl}`;
  }).join('\n\n');

  const waText = `📋 *گزارش بولتن هوشمند تلگرام (TeleAlert Bulletin)*\n` +
    `📅 *زمان:* ${dateFa}\n` +
    `🎯 *تعداد کل موارد کشف‌شده:* ${count} پست\n\n` +
    `کانال‌های تحت پوشش: @mizanplus | @FarsNA | @iribnews\n` +
    `───────────────────────\n\n` +
    bulletLines +
    `\n\n───────────────────────\n` +
    `⚡ این بولتن به صورت خودکار بدون نیاز به کلیک ارسال شده است.`;

  const cleanPhone = (payload.recipientPhone || '').replace(/[^0-9]/g, '');
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return { emailSubject, emailHtml, waText, waLink };
}

/**
 * Highlights matched keywords inside HTML text safely (supports Persian & English)
 */
export function highlightKeywordsInHtml(text: string, keywords: string[]): string {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  for (const kw of keywords) {
    if (!kw.trim()) continue;
    const regex = new RegExp(`(${escapeRegExp(kw.trim())})`, 'gi');
    escaped = escaped.replace(regex, '<span class="mark">$1</span>');
  }

  return escaped;
}

/**
 * Simple HTML parser for public Telegram web preview pages (t.me/s/{channel})
 */
export function parseTelegramWebPreview(html: string, channelName: string): Array<{
  id: string;
  text: string;
  date: string;
  views?: string;
  url: string;
}> {
  const posts: Array<{
    id: string;
    text: string;
    date: string;
    views?: string;
    url: string;
  }> = [];

  if (!html) return posts;

  // Split on data-post=
  const chunks = html.split(/data-post=["']/i);
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    const postTagMatch = /^([^"'>\s]+)/.exec(chunk);
    if (!postTagMatch) continue;

    const postTag = postTagMatch[1]; // e.g. "techradar/105"
    const id = postTag.includes('/') ? postTag.split('/')[1] : postTag;

    // Find message text: class="tgme_widget_message_text...
    const textMatch = /class=["'][^"']*tgme_widget_message_text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(chunk);
    let postText = '';
    if (textMatch) {
      postText = textMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
        .replace(/<[^>]+>/g, '')
        .trim();
    }

    // Find date: datetime="([^"]+)"
    const dateMatch = /datetime=["']([^"']+)["']/i.exec(chunk);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    // Find views: class="tgme_widget_message_views">([^<]+)
    const viewsMatch = /class=["'][^"']*tgme_widget_message_views[^"']*["'][^>]*>([^<]+)<\/span>/i.exec(chunk);
    const views = viewsMatch ? viewsMatch[1].trim() : undefined;

    const postUrl = postTag.includes('/') ? `https://t.me/${postTag}` : `https://t.me/${channelName}/${id}`;

    if (postText) {
      posts.push({
        id,
        text: postText,
        date,
        views,
        url: postUrl,
      });
    }
  }

  // Fallback if no data-post attributes were found but message text exists
  if (posts.length === 0 && html.includes('tgme_widget_message_text')) {
    const textRegex = /class=["'][^"']*tgme_widget_message_text[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
    let tMatch;
    let count = 1;
    while ((tMatch = textRegex.exec(html)) !== null) {
      const clean = tMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
      if (clean) {
        posts.push({
          id: String(count),
          text: clean,
          date: new Date().toISOString(),
          url: `https://t.me/${channelName}/${count}`,
        });
        count++;
      }
    }
  }

  return posts;
}
