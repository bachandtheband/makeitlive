// Contact form handler for POST /api/contact (called from worker/index.js).
//
// 1. Always: emails the enquiry to CONTACT_TO via Resend (https://resend.com).
// 2. Only when Cloudflare Turnstile is configured AND the visitor passed it: also emails a short confirmation
//    to the visitor (Reply-To = CONTACT_TO). Without Turnstile nobody can trigger mail to an arbitrary address.
//
// Until RESEND_API_KEY is set the handler answers 503 and the page falls back to a prefilled mailto: link, so
// nothing is lost. Without TURNSTILE_SECRET_KEY the form works as before, minus the confirmation.
//
// Settings (Cloudflare dashboard → Workers & Pages → makeitlive → Settings → Variables and Secrets), all as *secrets*
// unless noted:
//   RESEND_API_KEY        required to send anything
//   TURNSTILE_SECRET_KEY  enables the bot check (the public site key lives in index.html, data-sitekey)
//   CONTACT_TO            optional, default "bookings@makeitlive.agency"
//   CONTACT_FROM          optional, default "Make It Live <noreply@mail.makeitlive.agency>" (domain verified in Resend)

const EVENT_TYPES = ['Corporate', 'Wedding', 'Festival', 'Private party', 'Other'];
const SERVICES = ['DJ', 'Live musician', 'Live band', 'Performers', 'Photo & video', 'Full event support'];

const NL = {
  types: { Corporate: 'Corporate', Wedding: 'Bruiloft', Festival: 'Festival', 'Private party': 'Privéfeest', Other: 'Anders' },
  services: { DJ: "DJ's", 'Live musician': 'Live musicians', 'Live band': 'Live band', Performers: 'Performers', 'Photo & video': 'Foto & video', 'Full event support': 'Full event support' }
};

const TEXT = {
  nl: {
    subject: 'Bedankt voor je aanvraag — Make It Live',
    hi: (n) => `Hoi ${n},`,
    intro: 'Bedankt voor je bericht! We hebben je aanvraag goed ontvangen en antwoorden je binnen één werkdag.',
    got: 'Dit hebben we ontvangen:',
    type: 'Type event', date: 'Datum', looking: 'Waar je naar op zoek bent', message: 'Je bericht',
    more: 'Wil je iets aanvullen? Antwoord gewoon op deze mail.',
    bye: 'Tot snel,',
    footer: 'Je ontvangt deze mail omdat je het contactformulier op www.makeitlive.agency invulde. We gebruiken je gegevens alleen om je te antwoorden. Meer info: https://www.makeitlive.agency/privacy'
  },
  en: {
    subject: 'Thank you for your enquiry — Make It Live',
    hi: (n) => `Hi ${n},`,
    intro: "Thank you for your message! We received your enquiry and will reply within one working day.",
    got: 'This is what we received:',
    type: 'Type of event', date: 'Date', looking: 'What you are looking for', message: 'Your message',
    more: 'Want to add something? Just reply to this email.',
    bye: 'Talk soon,',
    footer: 'You are receiving this email because you filled in the contact form on www.makeitlive.agency. We only use your details to reply to you. More info: https://www.makeitlive.agency/privacy'
  }
};

const clean = (v, max) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/\s+/g, ' ');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const reply = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra }
  });

async function sendMail(key, payload) {
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}

async function verifyTurnstile(secret, token, ip) {
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const d = await r.json();
    return d && d.success === true;
  } catch (e) {
    return false;
  }
}

function prettyDate(date, lang) {
  if (!date) return '';
  try {
    return new Date(date + 'T00:00:00Z').toLocaleDateString(lang === 'nl' ? 'nl-BE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch (e) {
    return date;
  }
}

function confirmationMail(d) {
  const t = TEXT[d.lang];
  const type = d.lang === 'nl' ? NL.types[d.type] || d.type : d.type;
  const services = d.services.map((s) => (d.lang === 'nl' ? NL.services[s] || s : s)).join(', ');
  const rows = [[t.type, type]];
  if (d.date) rows.push([t.date, prettyDate(d.date, d.lang)]);
  if (services) rows.push([t.looking, services]);

  const text = [
    t.hi(d.name), '', t.intro, '', t.got,
    ...rows.map(([k, v]) => `- ${k}: ${v}`),
    ...(d.message ? ['', `${t.message}:`, d.message] : []),
    '', t.more, '', t.bye, 'Make It Live', 'You bring the people. We Make It Live.', '', t.footer
  ].join('\n');

  const font = 'font-family:Arial,Helvetica,sans-serif;color:#17161a;';
  const html =
    `<div style="${font}max-width:560px;margin:0 auto;padding:24px;font-size:15px;line-height:1.55">` +
    `<p style="margin:0 0 16px">${esc(t.hi(d.name))}</p><p style="margin:0 0 20px">${esc(t.intro)}</p>` +
    `<p style="margin:0 0 8px;font-weight:bold;color:#7d5a1f">${esc(t.got)}</p>` +
    '<table cellpadding="4" style="border-collapse:collapse;margin:0 0 16px">' +
    rows.map(([k, v]) => `<tr><td style="color:#777;padding-right:14px">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('') +
    '</table>' +
    (d.message ? `<p style="margin:0 0 4px;color:#777">${esc(t.message)}</p><p style="margin:0 0 20px;white-space:pre-wrap;border-left:3px solid #c9a24b;padding-left:12px">${esc(d.message)}</p>` : '') +
    `<p style="margin:0 0 20px">${esc(t.more)}</p><p style="margin:0">${esc(t.bye)}<br><strong>Make It Live</strong><br>` +
    '<span style="color:#7d5a1f">You bring the people. We Make It Live.</span></p>' +
    `<hr style="border:0;border-top:1px solid #e5e0d8;margin:24px 0 12px"><p style="margin:0;font-size:12px;color:#777">${esc(t.footer)}</p></div>`;
  return { subject: t.subject, text, html };
}

export async function handleContact(request, env, ctx) {
  if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' }, { Allow: 'POST' });

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
  const lang = body.lang === 'en' ? 'en' : 'nl';

  if (!name || !type || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: 'invalid' });

  const key = env.RESEND_API_KEY;
  if (!key) return reply(503, { error: 'not_configured' });

  // Bot check. When configured it is mandatory: no valid token, no mail at all.
  let human = false;
  if (env.TURNSTILE_SECRET_KEY) {
    const token = clean(body.turnstileToken, 2048);
    if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, request.headers.get('CF-Connecting-IP')))) {
      return reply(403, { error: 'captcha' });
    }
    human = true;
  }

  const to = env.CONTACT_TO || 'bookings@makeitlive.agency';
  const from = env.CONTACT_FROM || 'Make It Live <noreply@mail.makeitlive.agency>';

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Event type', type],
    ['Date', date || '—'],
    ['Looking for', services.join(', ') || '—'],
    ['Language', lang]
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\n' + (message || '(no message)');
  const html =
    '<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:15px">' +
    rows.map(([k, v]) => `<tr><td style="color:#777">${k}</td><td>${esc(v)}</td></tr>`).join('') +
    '</table><p style="font-family:Arial,sans-serif;font-size:15px;white-space:pre-wrap">' +
    esc(message || '(no message)') + '</p>';

  const delivered = await sendMail(key, { from, to: [to], reply_to: email, subject: `Website — ${type} — ${name}`, text, html });
  if (!delivered) return reply(502, { error: 'upstream' });

  // Confirmation to the visitor: only for verified humans, and a failure here never fails the request.
  if (human) {
    const c = confirmationMail({ name, type, date, services, message, lang });
    const job = sendMail(key, { from, to: [email], reply_to: to, subject: c.subject, text: c.text, html: c.html });
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(job); else await job;
  }
  return reply(200, { ok: true, confirmation: human });
}
