# LisaCreo Lead Worker

Cloudflare Worker: принимает заявки из чат-бота и отправляет email через Resend.

## Требования

- Node.js 18+
- Аккаунт Cloudflare (бесплатный план подходит)
- Аккаунт Resend (resend.com) с подтверждённым доменом lisacreo.pro

---

## Установка и деплой

### 1. Установить Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. Скопировать конфиг

```bash
cd worker
cp wrangler.toml.example wrangler.toml
```

### 3. Добавить API-ключ Resend как секрет

```bash
wrangler secret put RESEND_API_KEY
# Вставьте ключ из resend.com/api-keys (Send access)
```

### 4. Задеплоить

```bash
wrangler deploy
```

Wrangler выведет URL вида:
```
https://lisacreo-leads.<account>.workers.dev
```

### 5. Подключить к чат-боту

Добавьте в HTML перед `<script src="js/chatbot.js">`:

```html
<script>
  window.LISACREO_CHAT_CONFIG = {
    endpoint: 'https://lisacreo-leads.<account>.workers.dev'
  };
</script>
```

---

## Resend: настройка отправителя

1. Зайти на resend.com → Domains → Add Domain → `lisacreo.pro`
2. Добавить DNS-записи (TXT + MX) — Resend покажет что именно
3. После верификации: API Keys → Create API Key (Send access)
4. `wrangler secret put RESEND_API_KEY` → вставить ключ

Если домен ещё не верифицирован — можно временно использовать `onboarding@resend.dev`
(только для тестирования, только на свой email).

---

## CORS

Worker разрешает запросы только с `https://lisacreo.pro`.

Для локального тестирования временно добавьте в `src/index.js`:
```js
const ALLOWED_ORIGIN = request.headers.get('Origin') || 'https://lisacreo.pro';
```

---

## Payload

Worker принимает POST JSON:

```json
{
  "name":        "Имя пользователя",
  "contact":     "@telegram или email или телефон",
  "contactType": "telegram | email | phone | other",
  "audience":    "artist | brand | personal",
  "service":     "ai_photo | ai_video | visual | content",
  "goal":        "конкретный формат (текст)",
  "references":  "ссылки или текст",
  "deadline":    "срок",
  "page":        "/artists.html",
  "createdAt":   "2026-05-16T12:00:00.000Z"
}
```

Обязательные поля: `name`, `contact`, `service` или `goal`.

---

## Проверка

```bash
curl -X POST https://lisacreo-leads.<account>.workers.dev \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://lisacreo.pro' \
  -d '{"name":"Тест","contact":"@test","service":"ai_photo","goal":"тест"}'
```

Ожидаемый ответ: `{"ok":true}`
