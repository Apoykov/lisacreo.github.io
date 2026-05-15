// js/chatbot.js — LisaCreo AI-помощник
//
// Встроенный чат-бот: контекстный диалог, сбор брифа, overlay поверх страницы.
// Нет API-ключей во frontend. Нет автоматических сетевых запросов.
//
// ── КАК ПОДКЛЮЧИТЬ AI BACKEND ───────────────────────────────────────────────
// 1. Разверните serverless-функцию (Vercel / Netlify / Cloudflare Workers).
// 2. Функция: POST { messages: [{role, content}] } → { reply: "..." }
// 3. Внутри функции — ключ Anthropic/OpenAI (только на сервере, не во frontend).
// 4. Задайте: CONFIG.mode = 'api' и CONFIG.endpoint = 'https://your-api.../chat'
// 5. При ошибке сети — автоматический fallback на локальный режим.
// ────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ============================================================
  // КОНФИГУРАЦИЯ
  // ============================================================
  var CONFIG = {
    mode: 'local',
    endpoint: null,
    typingDelayMs: 650,
  };

  // ============================================================
  // CHIPS
  // ============================================================
  var CHIPS = [
    '🎤 Я артист',
    '🏢 Я бренд',
    '📸 Хочу AI-фото',
    '🎬 Хочу AI-видео',
    '💰 Сколько стоит?',
    '⏱ Какие сроки?',
    '🚀 Что нужно для старта?',
    '💬 Хочу обсудить проект',
  ];

  function getContextualChips(state) {
    var f = state.pendingField;

    if (f === 'audience') return ['🎤 Артист', '🏢 Бренд', '👤 Личный проект'];

    if (f === 'service') {
      if (state.audience === 'artist') return ['📸 AI-фото', '🎬 AI-видео', '🖼 Визуальный арт'];
      if (state.audience === 'brand')  return ['📣 Рекламный визуал', '🎬 AI-видео', '📸 Продуктовые фото', '📱 Контент'];
      return ['📸 AI-фото', '🎬 AI-видео', '📣 Реклама', '📱 Контент'];
    }

    if (f === 'goal') {
      if (state.service === 'ai_video') {
        return state.audience === 'brand'
          ? ['📣 Промо-ролик', '📱 Reels/TikTok', '🧴 Продуктовый ролик', '🎥 Бренд-видео']
          : ['🎧 Сниппет', '🎞 Клип', '📱 Reels/TikTok', '🎥 Эстетик-видео'];
      }
      if (state.service === 'ai_photo') {
        return state.audience === 'brand'
          ? ['📣 Реклама', '📸 Продуктовые фото', '📱 Reels', '📰 Пресс-кит']
          : ['🖼 Обложка', '📸 Пресс-фото', '📱 Reels', '📣 Реклама'];
      }
      if (state.service === 'content')  return ['📱 Instagram', '🎵 TikTok', '▶️ YouTube'];
      return [];
    }

    if (f === 'refs')     return ['🔗 Вставить ссылку', '⏳ Пришлю позже', '❌ Нет референсов'];
    if (f === 'refs_url') return [];
    if (f === 'deadline') return ['⚡ Срочно', '📅 На этой неделе', '🗓 Без дедлайна'];
    if (f === 'contact')  return ['✉️ Дам Telegram', '📧 Дам email'];

    if (state.briefMode || state.audience || state.service) {
      return ['💬 Расскажу подробнее', '✅ Готов отправить'];
    }

    return CHIPS;
  }

  var GREETING =
    'Привет! Я AI-помощник LisaCreo.\n' +
    'Помогу разобраться с услугами, сроками и собрать заявку.\n\n' +
    'С чего начнём?';

  // ============================================================
  // CONVERSATION STATE
  // ============================================================
  var chatState = {
    audience:     null,   // 'artist' | 'brand' | 'personal'
    service:      null,   // 'ai_photo' | 'ai_video' | 'visual' | 'content'
    goalText:     null,   // specific format / goal (free text)
    refs:         null,   // free text / 'yes' / 'no'
    deadline:     null,   // free text
    contact:      null,   // TG handle / email / name
    briefMode:      false,  // brief collection active
    pendingField:   null,   // field we're waiting an answer for
    askedFields:    [],     // fields already prompted — avoid re-asking
    topicsSeen:     [],     // intent topics already explained — avoid repeating
    msgCount:        0,
    badInputCount:   0,
    leadCompleted:   false,
  };

  function resetChatState() {
    chatState = {
      audience: null, service: null, goalText: null,
      refs: null, deadline: null, contact: null,
      briefMode: false, pendingField: null,
      askedFields: [], topicsSeen: [], msgCount: 0, badInputCount: 0, leadCompleted: false,
    };
  }

  // ============================================================
  // CONTEXT EXTRACTION
  // ============================================================
  // Reads free text and updates chatState with any implicit signals found.
  // Only fills fields that are still null — never overwrites confirmed values.
  function extractFromText(text) {
    var t = text.toLowerCase();

    // Audience
    if (!chatState.audience) {
      if (/артист|певец|музыкант|исполнитель|\bтрек\b|релиз|альбом|группа|сингл|\bep\b|песн/i.test(t)) {
        chatState.audience = 'artist';
      } else if (/бренд|компани|бизнес|магазин|марк|агентств/i.test(t)) {
        chatState.audience = 'brand';
      }
    }

    // Service / format
    if (!chatState.service) {
      if      (/ai[- ]?фото|нейрофото|нейрофот|фотосессия/i.test(t))              chatState.service = 'ai_photo';
      else if (/ai[- ]?видео|клип|сниппет|ролик|reels|shorts|tik.?tok/i.test(t)) chatState.service = 'ai_video';
      else if (/контент.{0,15}соц|соц.{0,15}контент|сторис|посты/i.test(t))      chatState.service = 'content';
      else if (/визуал.?арт|концепт.?арт|иллюстр/i.test(t))                       chatState.service = 'visual';
    }

    // Specific goal / format
    if (!chatState.goalText) {
      if      (/\bсниппет\b/i.test(t))           chatState.goalText = 'сниппет';
      else if (/\bклип\b/i.test(t))              chatState.goalText = 'клип';
      else if (/обложк/i.test(t))               chatState.goalText = 'обложка';
      else if (/промо.?ролик|promo/i.test(t))   chatState.goalText = 'промо-ролик';
      else if (/реклам/i.test(t))               chatState.goalText = 'рекламный визуал';
      else if (/сторис/i.test(t))               chatState.goalText = 'сторис';
    }

    // References
    if (!chatState.refs) {
      if (/есть (рефы|ссылки|примеры|референс)|скину (рефы|ссылки|примеры)/i.test(t)) chatState.refs = 'yes';
      if (/(нет|без) (рефов|ссылок|примеров|референс)/i.test(t))                      chatState.refs = 'no';
    }

    // Urgency
    if (!chatState.deadline && /срочно|asap/i.test(t)) chatState.deadline = 'срочно';
  }

  // ============================================================
  // INTENT DETECTION
  // ============================================================
  function detectIntent(text) {
    var t = text.toLowerCase().trim();
    if (/^(привет|здравствуй|добрый|hello|hi\b|ку\b|хай)/i.test(t))                              return 'greeting';
    if (/обсудить|хочу.{0,15}(начать|проект)|хочу.{0,10}заявк|давайте.{0,10}начнём/i.test(t))   return 'discuss';
    if (/ai[- ]?видео|нужен.{0,20}(ролик|видео)|ролик.{0,20}(под|для)/i.test(t))                return 'video';
    if (/ai[- ]?фото|нейрофото|фотосессия/i.test(t))                                             return 'photo';
    if (/\bя\b.{0,10}артист|\bдля\b.{0,10}артист|я.{0,10}(певец|музыкант)|мой.{0,10}(трек|релиз)/i.test(t)) return 'artist';
    if (/\bя\b.{0,10}бренд|наш.{0,10}бренд|\bдля\b.{0,10}бренда|мой.{0,10}(бизнес|продукт)/i.test(t))      return 'brand';
    if (/цен|стоим|сколько.{0,15}стоит|прайс|тариф|бюджет/i.test(t))                            return 'pricing';
    if (/срок|как быстро|за сколько.{0,10}(дней|времени)|недел/i.test(t))                        return 'timeline';
    if (/(что|чего) нужно|как начать|с чего начать|для старта/i.test(t))                         return 'start';
    // Weak signals last
    if (/клип|сниппет|ролик|видео/i.test(t))                   return 'video';
    if (/фото|снимок|образ|обложк/i.test(t))                   return 'photo';
    if (/артист|певец|музыкант|трек|релиз|альбом/i.test(t))    return 'artist';
    if (/бренд|компания|бизнес|продукт/i.test(t))              return 'brand';
    return null;
  }

  // ============================================================
  // BRIEF FLOW ENGINE
  // ============================================================

  function isLeadReady() {
    var hasCore  = !!(chatState.service || chatState.goalText) && !!chatState.audience;
    var hasExtra = !!(chatState.contact || chatState.deadline);
    return hasCore && hasExtra;
  }

  // Returns {field, q} for the next question, or null when all essentials filled.
  // Marks field in askedFields so it won't be prompted a second time.
  function getNextBestQuestion() {
    function asked(f) { return chatState.askedFields.indexOf(f) !== -1; }
    function ask(f, q) { if (!asked(f)) chatState.askedFields.push(f); return { field: f, q: q }; }

    if (!chatState.audience)
      return ask('audience', 'Вы артист или бренд?');

    if (!chatState.service && !asked('service')) {
      var svcQ = chatState.audience === 'artist'
        ? 'Что нужно — AI-фото, AI-видео или что-то ещё?'
        : 'Что нужно: рекламный визуал, AI-видео, продуктовые фото или контент?';
      return ask('service', svcQ);
    }

    if (!chatState.goalText && !asked('goal')) {
      var goalQ;
      if (chatState.service === 'ai_video') {
        goalQ = chatState.audience === 'brand'
          ? 'Какой формат видео нужен: промо-ролик, Reels/TikTok, продуктовый ролик или бренд-видео?'
          : 'Что конкретно — сниппет, клип, Reels или промо?';
      } else if (chatState.service === 'ai_photo') {
        goalQ = chatState.audience === 'brand'
          ? 'Для чего визуал: реклама, продуктовые фото, Reels или пресс-кит?'
          : 'Для чего визуал: обложка, пресс-фото, Reels или реклама?';
      } else if (chatState.service === 'content') {
        goalQ = 'Для каких платформ и форматов нужен контент?';
      } else {
        goalQ = 'Опишите задачу — что именно нужно создать?';
      }
      return ask('goal', goalQ);
    }

    if (!chatState.refs && !asked('refs'))
      return ask('refs', 'Есть референсы или примеры в похожем стиле?');

    if (!chatState.deadline && !asked('deadline'))
      return ask('deadline', 'К какому сроку нужно?');

    if (!chatState.contact && !asked('contact'))
      return ask('contact', 'Куда Алисе удобно написать вам — Telegram или email?');

    return null;
  }

  // ============================================================
  // RESPONSE BUILDING
  // ============================================================

  // Capture and store the answer to the last explicit question.
  // Returns a short acknowledgment string (or null for "contact" — lead card follows).
  function capturePendingField(field, text) {
    var t = text.trim();
    extractFromText(text); // also pick up implicit signals in the answer

    switch (field) {
      case 'audience':
        if (!chatState.audience) {
          if      (/артист|певец|музыкант/i.test(t)) chatState.audience = 'artist';
          else if (/бренд|компания|бизнес/i.test(t)) chatState.audience = 'brand';
          else                                         chatState.audience = t;
        }
        return chatState.audience === 'artist' ? 'Отлично!' : 'Хорошо.';

      case 'service':
        if (!chatState.service) {
          if      (/фото|нейрофото/i.test(t))           chatState.service = 'ai_photo';
          else if (/видео|клип|сниппет|ролик/i.test(t)) chatState.service = 'ai_video';
          else if (/контент|сторис/i.test(t))           chatState.service = 'content';
          else if (/визуал.?арт|концепт/i.test(t))      chatState.service = 'visual';
          else                                            chatState.goalText = chatState.goalText || t;
        }
        var svcLabels = { ai_photo: 'AI-фото', ai_video: 'AI-видео', visual: 'Визуал-арт', content: 'Контент' };
        return 'Понял, ' + (svcLabels[chatState.service] || t) + '.';

      case 'goal':
        chatState.goalText = chatState.goalText || t;
        return t.length <= 30 ? 'Отлично — ' + t.toLowerCase() + '.' : 'Понял.';

      case 'refs':
        if (/вставить ссылку|🔗/i.test(t)) {
          chatState.pendingField = 'refs_url';
          return 'Отправьте ссылку на Pinterest, Drive, Instagram, YouTube или любой другой источник.';
        }
        if (/пришлю позже|⏳/i.test(t)) {
          chatState.refs = 'Пришлёт позже';
          return 'Хорошо, пришлёте позже.';
        }
        if (/нет референсов|❌/i.test(t)) {
          chatState.refs = 'Без референсов';
          return 'Понял, работаем без референсов.';
        }
        if (!chatState.refs) chatState.refs = t;
        return /(^нет$|без реф|нет реф)/i.test(t) ? 'Без референсов — не проблема.' : 'Хорошо.';

      case 'refs_url':
        if (/https?:\/\/\S+|www\.\S+/i.test(t) || /pinterest|drive|instagram|youtube|figma|behance|dropbox/i.test(t)) {
          chatState.refs = t;
          return 'Отлично, ссылка сохранена.';
        }
        chatState.pendingField = 'refs_url';
        return 'Не нашёл ссылку. Отправьте URL — например, ссылку на Pinterest или Google Drive.';

      case 'deadline':
        if (!chatState.deadline) chatState.deadline = t;
        return 'Хорошо, запишем.';

      case 'contact':
        if (!chatState.contact) chatState.contact = t;
        return null; // lead card fires next

      default:
        return null;
    }
  }

  // Short ack when we enter brief mode via a natural message (not a direct question answer)
  function buildImplicitAck(intent) {
    function saw(k) { chatState.topicsSeen.push(k); }
    function alreadySaw(k) { return chatState.topicsSeen.indexOf(k) !== -1; }

    if (intent === 'video'  && !alreadySaw('video'))  { saw('video');  return 'Понял, нужно AI-видео.'; }
    if (intent === 'photo'  && !alreadySaw('photo'))  { saw('photo');  return 'Понял, нужно AI-фото.'; }
    if (intent === 'artist' && !alreadySaw('artist')) { saw('artist'); return 'Хорошо, для артиста.'; }
    if (intent === 'brand'  && !alreadySaw('brand'))  { saw('brand');  return 'Хорошо, для бренда.'; }
    if (intent === 'pricing')  return 'Цена станет понятна после брифа.';
    if (intent === 'timeline') return 'Учтём дедлайн.';
    return null;
  }

  // First-contact FAQ reply — used when we have no project context yet
  function buildFaqReply(intent) {
    function saw(k) { chatState.topicsSeen.push(k); }
    function alreadySaw(k) { return chatState.topicsSeen.indexOf(k) !== -1; }

    if (intent === 'greeting') {
      return 'Привет! Расскажите, что нужно создать — разберёмся вместе.\nВы артист или бренд?';
    }
    if (intent === 'artist') {
      if (!chatState.audience) chatState.audience = 'artist';
      if (!alreadySaw('artist')) { saw('artist'); return 'Для артистов делаем AI-фото, видео-сниппеты, клипы и обложки.\nЧто конкретно нужно?'; }
      return 'Что нужно — AI-фото, видео или что-то ещё?';
    }
    if (intent === 'brand') {
      if (!chatState.audience) chatState.audience = 'brand';
      if (!alreadySaw('brand')) { saw('brand'); return 'Для брендов — рекламный визуал, AI-видео и контент для соцсетей.\nЧто конкретно нужно?'; }
      return 'Что нужно — рекламный визуал, AI-видео или контент?';
    }
    if (intent === 'video') {
      if (!alreadySaw('video')) { saw('video'); return 'AI-видео — сниппеты, клипы, промо и контент для соцсетей.\nДля кого — артист или бренд?'; }
      return 'Для кого нужно видео — для артиста или бренда?';
    }
    if (intent === 'photo') {
      if (!alreadySaw('photo')) { saw('photo'); return 'AI-фото — реалистичные образы в любом стиле, без реальных съёмок.\nДля кого — артист или бренд?'; }
      return 'Для кого нужны фото — для артиста или бренда?';
    }
    if (intent === 'pricing') {
      saw('pricing');
      return 'Цена зависит от формата и объёма — фиксированного прайса нет.\nЧтобы сориентировать, расскажите: что нужно и для кого?';
    }
    if (intent === 'timeline') {
      return 'Сроки от 3 рабочих дней (AI-фото), от 5–7 дней (видео).\nЕсть конкретный дедлайн?';
    }
    if (intent === 'start') {
      return 'Главное — описать задачу, цель и формат. Референсы помогают, но не обязательны.\nС чего начнём — для артиста или бренда?';
    }
    return 'Хочу точнее понять задачу. Вам нужен визуал для артиста, бренда или личного проекта?';
  }

  // ============================================================
  // BAD INPUT DETECTION
  // ============================================================
  function detectBadInput(text) {
    var t = text.trim();
    if (chatState.pendingField && t.length < 2) return true;
    if (/(.)\1{4,}/.test(t)) return true;
    if (/\b(хуй|пизд|ёбан|ебан|блят|бляд|сука|пидор|залуп|мудак)\w*/i.test(t)) return true;
    if (/^(\S+)(\s+\1){3,}$/.test(t)) return true;
    if (chatState.pendingField && /^[^а-яёa-z]+$/i.test(t) && t.length < 4) return true;
    return false;
  }

  // ============================================================
  // CLIPBOARD
  // ============================================================
  function copyToClipboard(text, callback) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { callback(true); },
        function () { fallbackCopy(text, callback); }
      );
    } else {
      fallbackCopy(text, callback);
    }
  }

  function fallbackCopy(text, callback) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
    callback(ok);
  }

  // ============================================================
  // API MODE
  // ============================================================
  function callApi(history, onSuccess, onError) {
    if (!CONFIG.endpoint) { onError(new Error('endpoint not set')); return; }
    fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) { onSuccess(String(d.reply || '')); })
      .catch(onError);
  }

  // ============================================================
  // DOM HELPERS
  // ============================================================
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') { node.className = attrs[k]; }
        else { node.setAttribute(k, attrs[k]); }
      });
    }
    return node;
  }

  function focusable(container) {
    return Array.from(container.querySelectorAll(
      'button:not([disabled]),textarea:not([disabled]),input:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'
    ));
  }

  // ============================================================
  // BUILD DOM
  // ============================================================
  var SEND_SVG =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="22" y1="2" x2="11" y2="13"/>' +
    '<polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  function buildDOM() {
    var overlay = el('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'lc-chat-title',
    });
    overlay.className = 'lc-chat-overlay';
    overlay.hidden = true;

    var modal = el('div', { className: 'lc-chat-modal' });

    // ── Header
    var head = el('div', { className: 'lc-chat-head' });

    var avatar = el('div', { className: 'lc-chat-avatar', 'aria-hidden': 'true' });
    var avatarImg = el('img', {
      className: 'lc-chat-avatar__img',
      src: 'assets/optimized/portfolio/work-13.webp',
      alt: '',
      loading: 'lazy',
      decoding: 'async',
    });
    avatar.appendChild(avatarImg);

    var headInfo = el('div', { className: 'lc-chat-head__info' });
    var headText = el('div', { className: 'lc-chat-head__text' });
    var titleEl = el('h2', { id: 'lc-chat-title', className: 'lc-chat-title' });
    titleEl.textContent = 'LisaCreo AI';
    var subtitleEl = el('p', { className: 'lc-chat-subtitle' });
    subtitleEl.textContent = 'Помогу разобраться с форматом, сроками и собрать заявку';
    headText.append(titleEl, subtitleEl);
    headInfo.append(avatar, headText);

    var closeBtn = el('button', { className: 'lc-chat-close', type: 'button', 'aria-label': 'Закрыть чат' });
    closeBtn.innerHTML = '&times;';
    head.append(headInfo, closeBtn);

    // ── Messages
    var msgs = el('div', { className: 'lc-chat-messages', role: 'log', 'aria-live': 'polite', 'aria-atomic': 'false' });

    // ── Chips
    var chipsWrap = el('div', { className: 'lc-chat-chips', role: 'group', 'aria-label': 'Быстрые запросы' });

    // ── Privacy note
    var privacyEl = el('p', { className: 'lc-chat-privacy' });
    privacyEl.textContent = '🔒 Диалог работает локально. Заявка отправляется только после вашего подтверждения.';

    // ── Input area
    var footer = el('div', { className: 'lc-chat-footer' });
    var inputWrap = el('div', { className: 'lc-chat-input-wrap' });
    var input = el('textarea', { className: 'lc-chat-input', rows: '1', 'aria-label': 'Сообщение' });
    input.placeholder = 'Напишите сообщение...';
    var sendBtn = el('button', { className: 'lc-chat-send', type: 'button', 'aria-label': 'Отправить' });
    sendBtn.innerHTML = SEND_SVG;
    inputWrap.append(input, sendBtn);
    footer.appendChild(inputWrap);

    modal.append(head, msgs, chipsWrap, privacyEl, footer);
    overlay.appendChild(modal);

    return { overlay: overlay, modal: modal, closeBtn: closeBtn, msgs: msgs, input: input, sendBtn: sendBtn, chipsWrap: chipsWrap, footer: footer };
  }

  // ============================================================
  // MESSAGE NODES
  // ============================================================
  function msgNode(text, role) {
    var wrap = el('div', { className: 'lc-msg lc-msg--' + role });
    var bubble = el('div', { className: 'lc-msg__bubble' });
    text.split('\n').forEach(function (line, i, arr) {
      bubble.appendChild(document.createTextNode(line));
      if (i < arr.length - 1) bubble.appendChild(document.createElement('br'));
    });
    wrap.appendChild(bubble);
    return wrap;
  }

  function leadDoneNode() {
    var audienceLabels = { artist: 'Артист', brand: 'Бренд', personal: 'Личный проект' };
    var serviceLabels  = { ai_photo: 'AI-фото', ai_video: 'AI-видео', visual: 'Визуал-арт', content: 'Контент для соцсетей' };

    var whoVal     = audienceLabels[chatState.audience] || chatState.audience || '—';
    var serviceVal = serviceLabels[chatState.service]   || chatState.service  || '—';
    var goalVal    = chatState.goalText || '—';
    var refsVal    = chatState.refs === 'yes' ? 'Есть' : chatState.refs === 'no' ? 'Нет' : (chatState.refs || '—');
    var deadlineVal = chatState.deadline || '—';
    var contactVal  = chatState.contact  || '—';

    // Flatten service + goal for the text summary
    var whatVal = chatState.goalText
      ? (serviceLabels[chatState.service] ? serviceLabels[chatState.service] + ' — ' + chatState.goalText : chatState.goalText)
      : serviceVal;

    var leadLines = [
      'Заявка с сайта LisaCreo', '',
      'Кто: '         + whoVal,
      'Сервис: '      + whatVal,
      'Референсы: '   + refsVal,
      'Сроки: '       + deadlineVal,
      'Контакт: '     + contactVal,
    ];
    var leadText = leadLines.join('\n');

    var tgHref       = 'https://t.me/lisacreo?text=' + encodeURIComponent(leadText);
    var emailSubject = encodeURIComponent('Заявка с сайта LisaCreo');
    var emailBody    = encodeURIComponent(leadText + '\n\n— Отправлено через lisacreo.ru');

    // ── Full-width card
    var wrap = el('div', { className: 'lc-msg lc-msg--bot lc-msg--card' });
    var card = el('div', { className: 'lc-lead-card' });

    var headline = el('p', { className: 'lc-lead-card__headline' });
    headline.textContent = 'Готово — можно отправить заявку';
    card.appendChild(headline);

    var fieldDefs = [
      ['Кто',        whoVal],
      ['Сервис',     whatVal],
      ['Референсы',  refsVal],
      ['Сроки',      deadlineVal],
      ['Контакт',    contactVal],
    ];
    var fields = el('div', { className: 'lc-lead-card__fields' });
    fieldDefs.forEach(function (pair) {
      if (pair[1] === '—') return; // omit empty rows
      var row = el('div',  { className: 'lc-lead-card__field' });
      var key = el('span', { className: 'lc-lead-card__key' });
      key.textContent = pair[0];
      var val = el('span', { className: 'lc-lead-card__val' });
      val.textContent = pair[1];
      row.append(key, val);
      fields.appendChild(row);
    });
    card.appendChild(fields);

    var actions = el('div', { className: 'lc-lead-actions' });

    var tgBtn = el('a', {
      className: 'lc-lead-btn lc-lead-btn--tg',
      href: tgHref,
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    tgBtn.textContent = 'Отправить в Telegram';
    actions.appendChild(tgBtn);

    var emailBtn = el('a', {
      className: 'lc-lead-btn lc-lead-btn--email',
      href: 'mailto:alisa@lisacreo.ru?subject=' + emailSubject + '&body=' + emailBody,
      rel: 'noopener',
    });
    emailBtn.textContent = 'Отправить на email';
    actions.appendChild(emailBtn);

    var resetLink = el('button', { className: 'lc-lead-reset', type: 'button', 'data-lc-reset': '1' });
    resetLink.textContent = '↺ Заполнить заново';
    actions.appendChild(resetLink);

    card.appendChild(actions);
    wrap.appendChild(card);
    return wrap;
  }

  function typingNode() {
    var wrap = el('div', { className: 'lc-msg lc-msg--bot lc-msg--typing' });
    var bubble = el('div', { className: 'lc-msg__bubble' });
    var dots = el('div', { className: 'lc-typing-dots' });
    dots.innerHTML = '<span></span><span></span><span></span>';
    bubble.appendChild(dots);
    wrap.appendChild(bubble);
    return wrap;
  }

  function scrollBottom(container) {
    container.scrollTop = container.scrollHeight;
  }

  // ============================================================
  // MAIN MODULE
  // ============================================================
  function initChatBot() {
    var d = buildDOM();
    document.body.appendChild(d.overlay);

    // Pre-seed audience from page URL so questions are smarter on /artists and /brands
    (function seedPageContext() {
      var path = window.location.pathname;
      if (/artists\.html/i.test(path) && !chatState.audience) chatState.audience = 'artist';
      if (/brands\.html/i.test(path)  && !chatState.audience) chatState.audience = 'brand';
    })();

    var history    = [];
    var isOpen     = false;
    var isBotTyping = false;
    var prevFocus  = null;

    // ── Focus trap
    function trapKey(e) {
      if (e.key !== 'Tab') return;
      var els = focusable(d.modal);
      if (!els.length) return;
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    // ── Open
    function open() {
      if (isOpen) return;
      isOpen = true;
      prevFocus = document.activeElement;
      d.overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          d.overlay.classList.add('lc-chat-overlay--visible');
        });
      });
      d.modal.addEventListener('keydown', trapKey);
      setTimeout(function () { d.input.focus(); }, 50);
      if (d.msgs.childElementCount === 0) addBot(GREETING, false);
    }

    // ── Close
    function close() {
      if (!isOpen) return;
      isOpen = false;
      d.overlay.classList.remove('lc-chat-overlay--visible');
      d.modal.removeEventListener('keydown', trapKey);
      document.body.style.overflow = '';
      var ov = d.overlay;
      setTimeout(function () { if (!isOpen) ov.hidden = true; }, 320);
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    }

    // ── Add bot message
    function addBot(text, withDelay) {
      if (withDelay === undefined) withDelay = true;
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var delay = (withDelay && !reduced) ? CONFIG.typingDelayMs : 0;

      if (!delay) {
        d.msgs.appendChild(msgNode(text, 'bot'));
        scrollBottom(d.msgs);
        renderChips(getContextualChips(chatState));
        return;
      }

      isBotTyping = true;
      d.input.disabled = true;
      d.sendBtn.disabled = true;
      var typing = typingNode();
      d.msgs.appendChild(typing);
      scrollBottom(d.msgs);

      setTimeout(function () {
        isBotTyping = false;
        typing.remove();
        d.input.disabled = false;
        d.sendBtn.disabled = false;
        d.msgs.appendChild(msgNode(text, 'bot'));
        scrollBottom(d.msgs);
        d.input.focus();
        renderChips(getContextualChips(chatState));
      }, delay);
    }

    function addUser(text) {
      d.msgs.appendChild(msgNode(text, 'user'));
      scrollBottom(d.msgs);
    }

    function addLeadDone() {
      isBotTyping = true;
      d.input.disabled = true;
      d.sendBtn.disabled = true;
      var typing = typingNode();
      d.msgs.appendChild(typing);
      scrollBottom(d.msgs);
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(function () {
        isBotTyping = false;
        typing.remove();
        chatState.leadCompleted = true;
        d.msgs.appendChild(leadDoneNode());
        scrollBottom(d.msgs);
        renderChips([]);
        lockChat();
      }, reduced ? 0 : CONFIG.typingDelayMs);
    }

    // ── Ask the next brief question, optionally prefixed with an acknowledgment
    function continueBrief(ack) {
      if (isLeadReady()) { addLeadDone(); return; }
      var next = getNextBestQuestion();
      if (!next) { addLeadDone(); return; }
      chatState.pendingField = next.field;
      var reply = ack ? ack + '\n' + next.q : next.q;
      history.push({ role: 'assistant', content: reply });
      addBot(reply);
    }

    // ── Local conversation engine
    function handleLocal(text) {
      chatState.msgCount++;

      // Step 1: Capture the answer to whatever question we last asked
      if (chatState.pendingField) {
        if (detectBadInput(text)) {
          chatState.badInputCount++;
          var br;
          if (chatState.badInputCount >= 2) {
            br = 'Похоже, заявку сейчас не собрать. Можно начать заново или написать Алисе напрямую в Telegram.';
          } else if (chatState.pendingField === 'refs') {
            br = 'Напишите, что вам нравится визуально — например, «тёмный fashion, неон, крупные планы».';
          } else {
            br = 'Давайте вернёмся к задаче. Напишите по делу — так я смогу корректно собрать заявку.';
          }
          history.push({ role: 'assistant', content: br });
          addBot(br);
          return;
        }
        chatState.badInputCount = 0;
        var lastField = chatState.pendingField;
        chatState.pendingField = null;
        var ack = capturePendingField(lastField, text);
        if (chatState.pendingField !== null) {
          if (ack) { history.push({ role: 'assistant', content: ack }); addBot(ack); }
          return;
        }
        continueBrief(ack);
        return;
      }

      // Step 2: Extract implicit context + detect intent
      extractFromText(text);
      var intent = detectIntent(text);

      // Step 3: Explicit project / discuss intent → start brief immediately
      if (intent === 'discuss') {
        chatState.briefMode = true;
        continueBrief('Отлично, давайте соберём заявку.');
        return;
      }

      // Step 4: We already have project context → stay in brief mode, keep collecting
      if (chatState.briefMode || chatState.audience || chatState.service) {
        chatState.briefMode = true;
        if (isLeadReady()) { addLeadDone(); return; }
        var ack2 = buildImplicitAck(intent);
        continueBrief(ack2);
        return;
      }

      // Step 5: No project context yet → FAQ-style short reply
      var faqReply = buildFaqReply(intent);
      history.push({ role: 'assistant', content: faqReply });
      addBot(faqReply);
    }

    // ── Process user message (entry point)
    function send(text) {
      var t = text.trim();
      if (!t || isBotTyping || chatState.leadCompleted) return;

      addUser(t);
      history.push({ role: 'user', content: t });

      // API mode with local fallback
      if (CONFIG.mode === 'api' && CONFIG.endpoint) {
        isBotTyping = true;
        d.input.disabled = true;
        d.sendBtn.disabled = true;
        var apiTyping = typingNode();
        d.msgs.appendChild(apiTyping);
        scrollBottom(d.msgs);

        callApi(history, function (reply) {
          isBotTyping = false;
          d.input.disabled = false;
          d.sendBtn.disabled = false;
          apiTyping.remove();
          history.push({ role: 'assistant', content: reply });
          d.msgs.appendChild(msgNode(reply, 'bot'));
          scrollBottom(d.msgs);
          d.input.focus();
        }, function () {
          isBotTyping = false;
          d.input.disabled = false;
          d.sendBtn.disabled = false;
          apiTyping.remove();
          handleLocal(t);
        });
        return;
      }

      handleLocal(t);
    }

    // ── Event listeners
    d.closeBtn.addEventListener('click', close);

    d.overlay.addEventListener('click', function (e) {
      if (e.target === d.overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) close();
    });

    function submit() {
      var text = d.input.value;
      if (!text.trim()) return;
      d.input.value = '';
      resize(d.input);
      send(text);
    }

    d.sendBtn.addEventListener('click', submit);

    d.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });

    d.input.addEventListener('input', function () { resize(d.input); });

    d.msgs.addEventListener('click', function (e) {
      if (e.target.closest('[data-lc-reset]')) doReset();
    });

    function lockChat() {
      d.chipsWrap.style.display = 'none';
      d.footer.style.display = 'none';
    }

    function doReset() {
      resetChatState();
      history = [];
      d.msgs.innerHTML = '';
      d.chipsWrap.style.display = '';
      d.footer.style.display = '';
      d.input.disabled = false;
      d.sendBtn.disabled = false;
      d.input.value = '';
      renderChips(getContextualChips(chatState));
      addBot(GREETING, false);
      d.input.focus();
    }

    function renderChips(chips) {
      d.chipsWrap.innerHTML = '';
      chips.forEach(function (label) {
        var c = el('button', { className: 'lc-chip', type: 'button' });
        c.textContent = label;
        c.addEventListener('click', function () { send(label); });
        d.chipsWrap.appendChild(c);
      });
    }
    renderChips(getContextualChips(chatState));

    function resize(textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    // ── Open triggers: [data-chatbot-open]
    // Capture phase + stopImmediatePropagation prevents anchor-scroll handlers
    // (including production.js) from firing. production.js also guards with
    // isSamePageContactSectionLink() → belt-and-suspenders.
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-chatbot-open]');
      if (!trigger) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      open();
    }, true);

    return { open: open, close: close };
  }

  // ============================================================
  // BOOT
  // ============================================================
  function boot() {
    try { initChatBot(); }
    catch (err) { console.error('[LisaCreo] chatbot init failed:', err); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
