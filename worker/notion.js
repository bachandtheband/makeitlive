// Saves a contact-form enquiry as a new row in a Notion database (a simple CRM), called from worker/contact.js
// after the notification mail went out. The mail stays the safe route: if Notion is down or misconfigured the
// enquiry still arrives by mail, and a failure here is only logged (Cloudflare → Worker → Logs).
//
// Settings (Cloudflare → Workers & Pages → makeitlive → Settings → Variables and Secrets), both as *secrets*
// (plain variables are wiped by every deploy):
//   NOTION_TOKEN         internal integration token (starts with ntn_ or secret_)
//   NOTION_DATABASE_ID   id of the database (the 32 characters in its URL); the integration must be connected to it
//
// The database is read first and the row is built from the columns that exist, by name (case-insensitive):
//   title column (any name)  the visitor's name
//   E-mail                   email (or text)          Type event   select     Datum event  date
//   Diensten                 multi-select             Bericht      text       Taal         select
//   Status                   select or status         (new rows start as "Nieuw", or "Controleren" for a link in the message)
// Columns that are missing are skipped, so the row is always saved.

const API = 'https://api.notion.com/v1';
const VERSION = '2022-06-28';

// Alternative column names, tried in order after the first one
const ALIASES = {
  email: ['e-mail', 'email', 'mail'],
  type: ['type event', 'event type', 'type'],
  date: ['datum event', 'event date', 'datum', 'date'],
  services: ['diensten', 'services', 'looking for'],
  message: ['bericht', 'message'],
  lang: ['taal', 'language'],
  status: ['status']
};

const text = (s) => {
  // a Notion text value holds at most 2000 characters: split longer messages
  const parts = [];
  for (let i = 0; i < s.length; i += 2000) parts.push({ type: 'text', text: { content: s.slice(i, i + 2000) } });
  return parts;
};

// "Nieuw", or "Controleren" when the message contains a link (a common sign of a sales pitch or spam from a human)
export const startStatus = (message) => (/https?:\/\/|www\./i.test(message || '') ? 'Controleren' : 'Nieuw');

export function buildProperties(schema, lead) {
  const props = schema.properties || {};
  const find = (key) => {
    for (const alias of ALIASES[key]) {
      const hit = Object.entries(props).find(([name]) => name.trim().toLowerCase() === alias);
      if (hit) return { name: hit[0], def: hit[1] };
    }
    return null;
  };
  const out = {};

  const title = Object.entries(props).find(([, d]) => d.type === 'title');
  if (title) out[title[0]] = { title: text(lead.name) };

  const set = (key, value) => {
    const col = find(key);
    if (!col || value === '' || (Array.isArray(value) && !value.length)) return;
    const t = col.def.type;
    if (t === 'email') out[col.name] = { email: value };
    else if (t === 'rich_text') out[col.name] = { rich_text: text(String(value)) };
    else if (t === 'select') out[col.name] = { select: { name: String(value) } };
    else if (t === 'multi_select') out[col.name] = { multi_select: [].concat(value).map((name) => ({ name: String(name).replace(/,/g, ' ') })) };
    else if (t === 'date') out[col.name] = { date: { start: String(value) } };
    else if (t === 'status') {
      // a "status" column only accepts options that already exist
      const options = (col.def.status && col.def.status.options) || [];
      if (options.some((o) => o.name === value)) out[col.name] = { status: { name: String(value) } };
    }
  };

  set('email', lead.email);
  set('type', lead.type);
  set('date', lead.date);
  set('services', lead.services);
  set('message', lead.message);
  set('lang', lead.lang);
  set('status', lead.status);
  return out;
}

export async function saveToNotion(env, lead) {
  const headers = { Authorization: `Bearer ${env.NOTION_TOKEN}`, 'Notion-Version': VERSION, 'Content-Type': 'application/json' };
  const db = String(env.NOTION_DATABASE_ID).replace(/-/g, '');

  const meta = await fetch(`${API}/databases/${db}`, { headers });
  if (!meta.ok) throw new Error(`Notion database lookup failed: ${meta.status} ${(await meta.text()).slice(0, 200)}`);
  const schema = await meta.json();

  const res = await fetch(`${API}/pages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ parent: { database_id: db }, properties: buildProperties(schema, lead) })
  });
  if (!res.ok) throw new Error(`Notion page create failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
}
