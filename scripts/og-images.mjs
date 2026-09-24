/*
  Gera as imagens de partilha (Open Graph, 1200x630) a partir do hero real:
  planta no estado final, carimbo com o título, sem botão nem barra.
  Saída: public/og/{pt,en,es}.png

  Uso:
    PUBLIC_DRAFTS=off npm run dev   (em outro terminal; sem exemplos, a numeração é a do site no ar)
    npm run og
*/

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const exe = process.env.PW_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pages = { pt: '/', en: '/en', es: '/es' };

await mkdir('public/og', { recursive: true });
const browser = await chromium.launch({ executablePath: exe });
for (const [lang, url] of Object.entries(pages)) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  // Sem nota de cookies nem sugestão de idioma na imagem.
  await context.addInitScript(() => {
    localStorage.setItem('hp-consent', JSON.stringify({ v: 1, analytics: false, ads: false, t: Date.now() }));
    localStorage.setItem('hp-lang-dismissed', '1');
  });
  const page = await context.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: '.nav__right, .hero__cta, .skip-link, [data-sheet-indicator], [data-mobile-cta], [data-cookie-note], [data-lang-suggest] { display: none !important; }',
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `public/og/${lang}.png` });
  await context.close();
  console.log(`public/og/${lang}.png`);
}
await browser.close();
