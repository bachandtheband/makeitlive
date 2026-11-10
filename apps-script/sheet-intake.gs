// Google Apps Script that receives each website enquiry and adds it as a new row to a Google Sheet.
// Setup (Bacha, ~10 minutes), see README.md "Google Sheet":
//   1. Open the Sheet -> Extensions -> Apps Script, paste this file, save.
//   2. Project Settings (gear) -> Script properties -> add  SECRET = a long password you make up.
//   3. Deploy -> New deployment -> type "Web app", Execute as "Me", Who has access "Anyone" -> Deploy, allow access.
//   4. Copy the web app URL (ends in /exec). Put it in Cloudflare as secret SHEETS_URL, and the password as SHEETS_SECRET.
// Nothing secret is in this file: the password lives in the Script properties.
//
// Row 1 of the first tab holds the column headers. Columns are found by their header (case-insensitive); columns
// that are not listed below are left empty, so the Sheet can hold any extra columns and formulas. Add your own
// header names to a list if the Excel uses different ones. To use another tab, set a Script property TAB = its name.

const ALIASES = {
  received: ['ontvangen', 'datum aanvraag', 'aanvraag', 'timestamp', 'received', 'tijdstip'],
  name: ['naam', 'name'],
  email: ['e-mail', 'email', 'mail'],
  phone: ['telefoon', 'gsm', 'mobiel', 'mobile', 'phone', 'telefoonnummer'],
  type: ['type event', 'event type', 'type'],
  date: ['datum event', 'event date', 'datum', 'date'],
  services: ['diensten', 'services', 'looking for'],
  message: ['bericht', 'message', 'opmerkingen'],
  lang: ['taal', 'language'],
  status: ['status']
};

// A value that starts with = + - @ would be read as a formula (also a way to inject one): store it as plain text.
function safe(v) {
  const s = v === undefined || v === null ? '' : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: 'bad_request' }); }
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('SECRET');
  if (!secret || !data || data.secret !== secret) return reply({ ok: false, error: 'unauthorized' });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const tab = props.getProperty('TAB');
    const sheet = (tab && book.getSheetByName(tab)) || book.getSheets()[0];
    const width = Math.max(1, sheet.getLastColumn());
    const headers = sheet.getRange(1, 1, 1, width).getValues()[0].map((h) => String(h).trim().toLowerCase());
    const lead = Object.assign({}, data.row, { received: new Date() });
    const row = headers.map((h) => {
      const key = Object.keys(ALIASES).find((k) => ALIASES[k].indexOf(h) !== -1);
      if (!key) return '';
      return key === 'received' ? lead.received : safe(lead[key]);
    });
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}
