// LisaCreo Lead Worker — Cloudflare Workers + Resend API
// Docs: https://developers.cloudflare.com/workers/
//
// Setup:
//   1. cp wrangler.toml.example wrangler.toml
//   2. wrangler secret put RESEND_API_KEY
//   3. wrangler deploy
//   4. Set endpoint in window.LISACREO_CHAT_CONFIG

const ALLOWED_ORIGIN = 'https://lisacreo.pro';
const TO_EMAIL       = 'n.apoykov@gmail.com'; // TODO: change to armadmb200@gmail.com after domain verification
const FROM_EMAIL     = 'onboarding@resend.dev';
const RESEND_URL     = 'https://api.resend.com/emails';

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, corsHeaders);
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, corsHeaders);
    }

    // Validate required fields
    const { name, contact, service, goal } = body;
    if (!name || !contact || (!service && !goal)) {
      return json({ ok: false, error: 'Missing required fields: name, contact, service or goal' }, 422, corsHeaders);
    }

    // Build email text
    const lines = [
      `Имя:         ${name}`,
      `Контакт:     ${contact}`,
      `Тип контакта: ${body.contactType || '—'}`,
      ``,
      `Кто:         ${body.audience || '—'}`,
      `Сервис:      ${service || '—'}`,
      `Задача:      ${goal || '—'}`,
      `Референсы:   ${body.references || '—'}`,
      `Сроки:       ${body.deadline || '—'}`,
      ``,
      `Страница:    ${body.page || '—'}`,
      `Время:       ${body.createdAt || new Date().toISOString()}`,
    ];
    const emailText = 'Новая заявка с сайта LisaCreo\n\n' + lines.join('\n');

    // Send via Resend
    const resendRes = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      TO_EMAIL,
        subject: 'Новая заявка LisaCreo',
        text:    emailText,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('[lisacreo-worker] Resend error', resendRes.status, errText);
      return json({ ok: false, error: 'Email delivery failed', resend_status: resendRes.status, resend_error: errText }, 502, corsHeaders);
    }

    return json({ ok: true }, 200, corsHeaders);
  },
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
