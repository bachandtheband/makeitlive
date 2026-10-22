// Cloudflare Worker entry. Static files are served straight from ./dist (see wrangler.jsonc);
// only requests under /api/* run this code.
import { handleContact } from './contact.js';

const notFound = () =>
  new Response(JSON.stringify({ error: 'not_found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return handleContact(request, env);
    if (pathname.startsWith('/api/')) return notFound();
    // Anything else that reaches the Worker: let the static assets answer (including the 404 page)
    return env.ASSETS.fetch(request);
  }
};
