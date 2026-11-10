// Adds each contact-form enquiry as a row to a Google Sheet, through a small Google Apps Script web app
// (apps-script/sheet-intake.gs). Called from worker/contact.js after the mail went out; a failure is only logged.
//
// Settings (Cloudflare -> Workers & Pages -> makeitlive -> Settings -> Variables and Secrets), both as *secrets*:
//   SHEETS_URL     the web app address from "Deploy" in Apps Script (https://script.google.com/macros/s/.../exec)
//   SHEETS_SECRET  the same password as the script property SECRET

export async function saveToSheet(env, lead) {
  const url = new URL(env.SHEETS_URL);
  // the password is only ever sent to Google
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com') throw new Error('Sheet: SHEETS_URL must be a https://script.google.com/... address');

  // Apps Script answers a POST with a redirect to the result; fetch follows it
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret: env.SHEETS_SECRET, row: lead }),
    redirect: 'follow'
  });
  const body = await res.text();
  let answer = null;
  try { answer = JSON.parse(body); } catch (e) { /* not JSON */ }
  if (!res.ok || !answer) {
    throw new Error(`Sheet request failed: ${res.status}. Is the web app deployed with access "Anyone"? ${body.replace(/\s+/g, ' ').slice(0, 120)}`);
  }
  if (!answer.ok) throw new Error(`Sheet refused the row: ${answer.error || 'unknown'}`);
}
