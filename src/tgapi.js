// ============================================================
//  Technamooz AI — technamooz-ai-version1.0.0
//  Author: Amir Parsa (امیر پارسا)
//  src/tgapi.js — small, dependency-free Telegram Bot API client
// ============================================================

const API = 'https://api.telegram.org/bot';

export async function tgApiRaw(method, token, payload = {}, timeoutMs = 25000) {
  if (!token) return { ok: false, error: 'missing token', description: 'missing token' };
  try {
    const res = await fetch(API + token + '/' + method, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
      signal: AbortSignal.timeout(timeoutMs)
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* ignore */ }
    if (!json) {
      return { ok: false, error: 'invalid json', description: text.slice(0, 240) };
    }
    if (!res.ok || !json.ok) {
      return {
        ok: false,
        error: json.description || ('HTTP ' + res.status),
        description: json.description || ('HTTP ' + res.status),
        error_code: json.error_code || res.status,
        parameters: json.parameters
      };
    }
    return json;
  } catch (e) {
    return {
      ok: false,
      error: String((e && e.message) || e).slice(0, 240),
      description: String((e && e.message) || e).slice(0, 240)
    };
  }
}

export async function tgGetMe(token) {
  const r = await tgApiRaw('getMe', token, {}, 15000);
  if (r && r.ok && r.result && r.result.username) {
    return {
      ok: true,
      id: r.result.id,
      username: r.result.username,
      first_name: r.result.first_name || '',
      can_join_groups: r.result.can_join_groups,
      can_read_all_group_messages: r.result.can_read_all_group_messages
    };
  }
  return { ok: false, error: (r && (r.description || r.error)) || 'unknown' };
}

export function randomSecret(len = 24) {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Split long text into Telegram-safe chunks without breaking UTF-8
 * surrogate pairs. Prefers paragraph/line/space boundaries.
 */
export function splitText(text, limit = 3800) {
  const input = String(text == null ? '' : text);
  if (!input) return [];
  if (limit < 100) limit = 100;
  const out = [];
  let chars = Array.from(input);

  while (chars.length > limit) {
    let cut = -1;
    for (let i = limit; i >= Math.floor(limit * 0.55); i--) {
      const ch = chars[i];
      if (ch === '\n' || ch === ' ' || ch === '،' || ch === '؛' || ch === '.' || ch === '!' || ch === '?') {
        cut = i;
        break;
      }
    }
    if (cut <= 0) cut = limit;
    let chunk = chars.slice(0, cut).join('').replace(/\s+$/, '');
    if (!chunk) chunk = chars.slice(0, limit).join('');
    out.push(chunk);
    chars = chars.slice(cut);
    while (chars.length && /^\s$/.test(chars[0])) chars.shift();
  }
  if (chars.length) out.push(chars.join(''));
  return out;
}

export async function tgSendMessage(token, chatId, text, options = {}) {
  const chunks = splitText(text, options.chunkLimit || 3800);
  const results = [];
  for (const chunk of chunks) {
    const payload = {
      chat_id: chatId,
      text: chunk,
      disable_web_page_preview: options.disablePreview !== false,
      ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
      ...(options.parseMode ? { parse_mode: options.parseMode } : {})
    };
    const r = await tgApiRaw('sendMessage', token, payload);
    results.push(r);
    // Only the first chunk should carry the keyboard.
    if (options.replyMarkup) options = { ...options, replyMarkup: null };
  }
  return results[results.length - 1] || { ok: false, error: 'empty text' };
}

export async function tgEditMessageText(token, chatId, messageId, text, options = {}) {
  return tgApiRaw('editMessageText', token, {
    chat_id: chatId,
    message_id: messageId,
    text: String(text).slice(0, 3900),
    disable_web_page_preview: true,
    ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {})
  });
}

export async function tgAnswerCallback(token, id, text = '', showAlert = false) {
  return tgApiRaw('answerCallbackQuery', token, {
    callback_query_id: id,
    text: String(text).slice(0, 180),
    show_alert: !!showAlert
  }, 10000);
}

export async function tgSendChatAction(token, chatId, action = 'typing') {
  return tgApiRaw('sendChatAction', token, { chat_id: chatId, action }, 10000);
}

export async function tgSetWebhook(token, url, secretToken) {
  return tgApiRaw('setWebhook', token, {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
    max_connections: 40
  }, 20000);
}

export async function tgDeleteWebhook(token) {
  return tgApiRaw('deleteWebhook', token, { drop_pending_updates: false }, 15000);
}

export async function tgGetWebhookInfo(token) {
  return tgApiRaw('getWebhookInfo', token, {}, 15000);
}

export async function tgSetMyCommands(token) {
  return tgApiRaw('setMyCommands', token, {
    commands: [
      { command: 'start', description: 'شروع و راهنما' },
      { command: 'models', description: 'انتخاب پلتفرم و مدل' },
      { command: 'persona', description: 'انتخاب شخصیت' },
      { command: 'deep', description: 'روشن/خاموش کردن حالت نهایت قدرت' },
      { command: 'new', description: 'گفتگوی جدید' },
      { command: 'reset', description: 'پاک کردن حافظه' },
      { command: 'settings', description: 'تنظیمات من' },
      { command: 'support', description: 'پشتیبانی' },
      { command: 'social', description: 'شبکه‌های اجتماعی' },
      { command: 'about', description: 'دربارهٔ تکناموز' },
      { command: 'feedback', description: 'ارسال بازخورد' },
      { command: 'help', description: 'راهنما' }
    ]
  }, 15000);
}
