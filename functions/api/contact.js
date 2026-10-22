// Contact form handler: Cloudflare Pages Function (route: POST /api/contact).
//
// Sends the enquiry to CONTACT_TO via Resend (https://resend.com). Until RESEND_API_KEY is set it answers 503
// and the page falls back to a prefilled mailto: link, so nothing is lost while the mailbox is being set up.
//
// Settings (Cloudflare dashboard → Workers & Pages → your project → Settings → Variables and Secrets):
//   RESEND_API_KEY   required — add as a *secret*
//   CONTACT_FROM     optional — verified sender, default "Make It Live <noreply@makeitlive.agency>"
//   CONTACT_TO       optional — inbox that receives enquiries, default "hello@makeitlive.agency"

const EVENT_TYPES = ['Corporate', 'Wedding', 'Festival', 'Private party', 'Other'];
const SERVICES = ['DJ', 'Live musician', 'Live band', 'Performers', 'Photo & video', 'Full event support'];

const clean = (v, max) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/\s+/g, ' ');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const reply = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra }
  });

// Anything other than POST
export const onRequest = () => reply(405, { error: 'method_not_allowed' }, { Allow: 'POST' });

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = (await request.json()) || {}; } catch (e) { body = {}; }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (body.website) return reply(200, { ok: true });

  const name = oneLine(body.name, 100);
  const email = oneLine(body.email, 200);
  const type = EVENT_TYPES.includes(body.type) ? body.type : '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : '';
  const message = clean(body.message, 3000);
  const services = (Array.isArray(body.services) ? body.services : []).filter((s) => SERVICES.includes(s));

  if (!name || !type || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: 'invalid' });

  const key = env.RESEND_API_KEY;
  if (!key) return reply(503, { error: 'not_configured' });

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Event type', type],
    ['Date', date || '—'],
    ['Looking for', services.join(', ') || '—']
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\n' + (message || '(no message)');
  const html =
    '<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:15px">' +
    rows.map(([k, v]) => `<tr><td style="color:#777">${k}</td><td>${esc(v)}</td></tr>`).join('') +
    '</table><p style="font-family:Arial,sans-serif;font-size:15px;white-space:pre-wrap">' +
    esc(message || '(no message)') + '</p>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'Make It Live <noreply@makeitlive.agency>',
        to: [env.CONTACT_TO || 'hello@makeitlive.agency'],
        reply_to: email,
        subject: `Website — ${type} — ${name}`,
        text,
        html
      })
    });
    if (!r.ok) return reply(502, { error: 'upstream' });
    return reply(200, { ok: true });
  } catch (e) {
    return reply(502, { error: 'upstream' });
  }
}
