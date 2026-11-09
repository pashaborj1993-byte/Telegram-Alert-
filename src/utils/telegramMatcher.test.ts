import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeChannelUsername,
  normalizePersianText,
  splitKeywords,
  matchKeywords,
  formatEmailAlert,
  formatWhatsAppAlert,
  formatHourlyDigest,
  parseTelegramWebPreview,
  highlightKeywordsInHtml,
} from './telegramMatcher.ts';

test('normalizeChannelUsername handles web.telegram.org links, mapped agency handles, negative IDs, and URLs', () => {
  assert.equal(normalizeChannelUsername('https://web.telegram.org/a/#-1001006939659'), 'mizanplus');
  assert.equal(normalizeChannelUsername('https://web.telegram.org/k/#-1001275084443'), 'FarsNA');
  assert.equal(normalizeChannelUsername('-1001004576149'), 'iribnews');
  assert.equal(normalizeChannelUsername('https://web.telegram.org/a/#-1009998887776'), '-1009998887776');
  assert.equal(normalizeChannelUsername('@mizanplus'), 'mizanplus');
  assert.equal(normalizeChannelUsername('https://t.me/mizanplus'), 'mizanplus');
  assert.equal(normalizeChannelUsername('https://t.me/FarsNA'), 'FarsNA');
  assert.equal(normalizeChannelUsername('@farsna'), 'FarsNA');
  assert.equal(normalizeChannelUsername('https://t.me/iribnews'), 'iribnews');
});

test('normalizePersianText standardizes Arabic Yeh/Kaf, diacritics, and ZWNJ', () => {
  // Arabic Yeh and Kaf in "اعدام" with Harakat and ZWNJ
  const withArabic = 'اعْدام كروه منافقين';
  const normalized = normalizePersianText(withArabic);
  assert.equal(normalized, 'اعدام کروه منافقین');
  assert.match(normalized, /منافقین/);
});

test('splitKeywords splits on both English and Persian commas', () => {
  const persianInput = 'اعدام، منافقین، رجوی، پهلوی، دار مجازات';
  const split = splitKeywords(persianInput);
  assert.deepEqual(split, ['اعدام', 'منافقین', 'رجوی', 'پهلوی', 'دار مجازات']);
});

test('matchKeywords accurately detects requested Persian execution keywords', () => {
  const post = 'خبرگزاری رسمی از اجرای حکم اعدام و به دار مجازات آویخته شدن محکومان در زندان خبر داد.';
  const result = matchKeywords(post, {
    keywords: ['اعدام', 'منافقین', 'رجوی', 'پهلوی', 'دار مجازات'],
  });

  assert.equal(result.matched, true);
  assert.ok(result.matchedKeywords.includes('اعدام'));
  assert.ok(result.matchedKeywords.includes('دار مجازات'));
});

test('matchKeywords detects political keywords: پهلوی and رجوی', () => {
  const post1 = 'بیانیه رضا پهلوی در خصوص اعتراضات سراسری و لغو احکام اعدام.';
  const res1 = matchKeywords(post1, {
    keywords: ['پهلوی', 'رجوی'],
  });
  assert.equal(res1.matched, true);
  assert.deepEqual(res1.matchedKeywords, ['پهلوی']);

  const post2 = 'موضع‌گیری سران فرقه رجوی و سازمان منافقین در نشست اخیر.';
  const res2 = matchKeywords(post2, {
    keywords: ['رجوی', 'منافقین'],
  });
  assert.equal(res2.matched, true);
  assert.deepEqual(res2.matchedKeywords, ['رجوی', 'منافقین']);
});

test('formatHourlyDigest produces clean bilingual email and whatsapp payload', () => {
  const digest = formatHourlyDigest({
    alerts: [
      {
        id: 'a1',
        channel: '-1001006939659',
        ruleName: 'اخبار اعدام',
        matchedKeywords: ['اعدام', 'دار مجازات'],
        postSnippet: 'گزارش اجرای حکم اعدام در سحرگاه امروز.',
        postUrl: 'https://t.me/c/1006939659/100',
        timestamp: Date.now(),
        priority: 'critical',
      },
    ],
    recipientEmail: 'pashaborj1993@gmail.com',
    recipientPhone: '+1-202-555-0143',
  });

  assert.match(digest.emailSubject, /TeleAlert Report/);
  assert.match(digest.emailHtml, /1001006939659/);
  assert.match(digest.waText, /بولتن هوشمند تلگرام/);
  assert.match(digest.waText, /• \*#1/);
});

test('parseTelegramWebPreview correctly parses mock Telegram HTML channel preview', () => {
  const sampleHtml = `
    <div class="tgme_channel_info_header_title">خبرگزاری میزان</div>
    <div class="tgme_widget_message_wrap js-widget_message_wrap" data-post="mizanplus/270157">
      <div class="tgme_widget_message_text js-message_text">ابراهیم الهی در فینال با شکست حریف به مدال نقره رسید.<br>اخبار تکمیلی دادگاه‌ها به زودی منتشر می‌شود.</div>
      <time class="time" datetime="2026-10-19T10:00:00Z"></time>
      <span class="tgme_widget_message_views">14.2K</span>
    </div>
  `;

  const posts = parseTelegramWebPreview(sampleHtml, 'mizanplus');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].id, '270157');
  assert.equal(posts[0].url, 'https://t.me/mizanplus/270157');
  assert.ok(posts[0].text.includes('ابراهیم الهی'));
  assert.equal(posts[0].views, '14.2K');
});

test('matchKeywords respects excludedKeywords to eliminate false positives', () => {
  const textWithSpam = 'تبلیغ کانال: اخبار اعدام و احکام دادگاه';
  const result = matchKeywords(textWithSpam, {
    keywords: ['اعدام'],
    excludedKeywords: ['تبلیغ'],
  });

  assert.equal(result.matched, false);
  assert.equal(result.excludedTrigger, 'تبلیغ');
});

test('formatEmailAlert renders bilingual responsive email template', () => {
  const alert = formatEmailAlert({
    channel: 'mizanplus',
    ruleName: '🚨 رصد احکام اعدام',
    matchedKeywords: ['اعدام', 'دار مجازات'],
    postText: 'محکوم علیه سحرگاه امروز در محوطه زندان به دار مجازات آویخته شد.',
    postUrl: 'https://t.me/mizanplus/999',
    timestamp: 1729400000000,
    priority: 'critical',
  });

  assert.match(alert.subject, /CRITICAL/);
  assert.match(alert.subject, /اعدام/);
  assert.match(alert.html, /mizanplus/);
  assert.match(alert.html, /https:\/\/t.me\/mizanplus\/999/);
});

test('highlightKeywordsInHtml wraps matched words in span tags safely', () => {
  const rawText = 'حکم اعدام برای متهمان پرونده صادر شد.';
  const highlighted = highlightKeywordsInHtml(rawText, ['اعدام']);
  assert.ok(highlighted.includes('<span class="mark">اعدام</span>'));
});

