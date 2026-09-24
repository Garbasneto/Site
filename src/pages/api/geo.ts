/* País do visitante pela geolocalização da Vercel (cabeçalho x-vercel-ip-country). */

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ request }) =>
  new Response(JSON.stringify({ country: request.headers.get('x-vercel-ip-country') || null }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
