// Cloudflare Worker entry. Static files are served straight from ./dist (see wrangler.jsonc);
// only requests under /api/* and /assets/video/* run this code.
import { handleContact } from './contact.js';

const notFound = () =>
  new Response(JSON.stringify({ error: 'not_found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

// Static assets are always answered with the full file (200), but Safari/iOS only play a <video> when the server
// supports byte ranges (206 + Content-Range). So videos go through here and get proper Range support.
async function serveWithRange(request, env) {
  // Ask the assets for the whole file (without the Range header, which they ignore anyway)
  const res = await env.ASSETS.fetch(new Request(request.url, { method: 'GET' }));
  if (res.status !== 200) return res;

  const headers = new Headers(res.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.delete('Content-Encoding');

  const range = request.headers.get('Range');
  if (request.method === 'HEAD' || !range) {
    if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
    return new Response(res.body, { status: 200, headers });
  }

  const body = await res.arrayBuffer();
  const size = body.byteLength;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim()); // a single range; anything else: serve the whole file
  if (!m || (m[1] === '' && m[2] === '')) {
    headers.set('Content-Length', String(size));
    return new Response(body, { status: 200, headers });
  }

  let start, end;
  if (m[1] === '') { // suffix: the last N bytes
    start = Math.max(size - Number(m[2]), 0);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' } });
  }

  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(body.slice(start, end + 1), { status: 206, headers });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return handleContact(request, env);
    if (pathname.startsWith('/api/')) return notFound();
    if (pathname.startsWith('/assets/video/') && (request.method === 'GET' || request.method === 'HEAD')) {
      return serveWithRange(request, env);
    }
    // Anything else that reaches the Worker: let the static assets answer (including the 404 page)
    return env.ASSETS.fetch(request);
  }
};
