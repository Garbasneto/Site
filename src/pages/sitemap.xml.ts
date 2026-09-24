/*
  Sitemap com as versões de cada página nos três idiomas (xhtml:link).
  Páginas legais com [PREENCHER] ficam de fora até a revisão.
*/
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { alternates, defaultLocale, htmlLang, locales, type RouteKey } from '../i18n';

export const GET: APIRoute = async ({ site }) => {
  const legal = await getCollection('legal');
  const ready = (route: 'privacy' | 'cookies') =>
    legal.filter((e) => Object.values(alternates(route)).some((p) => e.id.endsWith(`/${p.split('/').pop()}`))).every((e) => !e.body?.includes('[PREENCHER'));

  const routes: RouteKey[] = ['home', 'start'];
  if (ready('privacy')) routes.push('privacy');
  if (ready('cookies')) routes.push('cookies');

  const abs = (p: string) => new URL(p, site).toString().replace(/(?<=[^/])\/$/, '');
  const urls = routes.flatMap((route) => {
    const alts = alternates(route);
    const links = [
      ...locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${htmlLang[l]}" href="${abs(alts[l])}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(alts[defaultLocale])}"/>`,
    ].join('\n');
    return locales.map((l) => `  <url>\n    <loc>${abs(alts[l])}</loc>\n${links}\n  </url>`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
