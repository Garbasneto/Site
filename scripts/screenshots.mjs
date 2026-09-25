/*
  Revisão visual: tira screenshots do hero em 390x844 e 1440x900.
  Captura 0,5 s, 1,5 s e 3 s da abertura e três pontos da extrusão no scroll.

  Uso:
    npm run dev            (em outro terminal)
    npm run shots          (ou: BASE_URL=http://localhost:4321 node scripts/screenshots.mjs)

  Variáveis opcionais:
    BASE_URL        endereço do site (padrão http://127.0.0.1:4321)
    SHOTS_DIR       pasta de saída (padrão screenshots/latest)
    PAGE            caminho da página (padrão /)
    PW_CHROMIUM     caminho de um Chromium já instalado
    REDUCED=1       captura também com prefers-reduced-motion
*/

import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const OUT = process.env.SHOTS_DIR ?? 'screenshots/latest';
const PAGE = process.env.PAGE ?? '/';
const exe = process.env.PW_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const viewports = [
  { name: 'mobile-390x844', options: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } },
  { name: 'desktop-1440x900', options: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
];

// Navegador no idioma da página: é o que o visitante desse idioma vê (sem sugestão de troca).
const LOCALE = process.env.LOCALE ?? ({ en: 'en-US', es: 'es-ES' }[(process.env.PAGE ?? '/').split('/')[1]] ?? 'pt-PT');

const errors = [];

async function shootIntro(browser, vp, reduced) {
  const context = await browser.newContext({ ...vp.options, locale: LOCALE, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  // A nota de cookies tem capturas próprias; aqui a escolha já está feita (COOKIE_NOTE=1 mostra a nota).
  if (!process.env.COOKIE_NOTE)
    await context.addInitScript(() => localStorage.setItem('hp-consent', JSON.stringify({ v: 1, analytics: false, ads: false, t: Date.now() })));
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${vp.name}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${vp.name}] ${e.message}`));
  const tag = `${vp.name}${reduced ? '-reduced' : ''}`;
  await page.goto(BASE + PAGE, { waitUntil: 'commit' });
  const marks = reduced ? [1.5] : [0.5, 1.5, 3];
  for (const t of marks) {
    await page.waitForFunction((ms) => performance.now() >= ms, t * 1000, { polling: 16 });
    await page.screenshot({ path: `${OUT}/${tag}-t${String(t).replace('.', '_')}s.png` });
  }
  await page.waitForLoadState('networkidle');

  // Extrusão: três pontos do trecho fixo.
  const range = await page.evaluate(() => {
    const t = document.querySelector('[data-hero-track]');
    return t ? t.offsetHeight - window.innerHeight : 0;
  });
  const points = reduced ? [] : [0.2, 0.42, 0.7];
  for (const p of points) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(range * p));
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/${tag}-scroll${Math.round(p * 100)}.png` });
  }
  if (reduced) {
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${tag}-below.png` });
  }
  await context.close();
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: exe });
for (const vp of viewports) {
  await shootIntro(browser, vp, false);
  if (process.env.REDUCED) await shootIntro(browser, vp, true);
}
await browser.close();

if (errors.length) {
  console.log('Erros no console:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Screenshots em ${OUT}. Console sem erros.`);
}
