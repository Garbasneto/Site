/*
  Revisão visual das folhas F.02 a F.08, do índice, da grelha (tecla G) e da 404.
  Uso: npm run dev (em outro terminal) e depois npm run shots:sheets
  Variáveis: BASE_URL, SHOTS_DIR (padrão screenshots/sheets), PAGE, PW_CHROMIUM
*/

import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const OUT = process.env.SHOTS_DIR ?? 'screenshots/sheets';
const PAGE = process.env.PAGE ?? '/';
const exe = process.env.PW_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const viewports = [
  { name: 'mobile', options: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } },
  { name: 'desktop', options: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
];

// Navegador no idioma da página: é o que o visitante desse idioma vê (sem sugestão de troca).
const LOCALE = process.env.LOCALE ?? ({ en: 'en-US', es: 'es-ES' }[(process.env.PAGE ?? '/').split('/')[1]] ?? 'pt-PT');

const errors = [];
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: exe });

const scrollTo = async (page, y, wait = 1400) => {
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, Math.round(y)));
  await page.waitForTimeout(wait);
};

for (const vp of viewports) {
  const context = await browser.newContext({ ...vp.options, locale: LOCALE });
  // A nota de cookies tem capturas próprias; aqui a escolha já está feita (COOKIE_NOTE=1 mostra a nota).
  if (!process.env.COOKIE_NOTE)
    await context.addInitScript(() => localStorage.setItem('hp-consent', JSON.stringify({ v: 1, analytics: false, ads: false, t: Date.now() })));
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${vp.name}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${vp.name}] ${e.message}`));
  await page.goto(BASE + PAGE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Percorre a página inteira para disparar as revelações.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = vp.options.viewport.height;
  for (let y = 0; y < height; y += vh * 0.6) await scrollTo(page, y, 90);

  const sheets = await page.evaluate(() =>
    [...document.querySelectorAll('[data-sheet]')].map((s) => ({ id: s.id, top: s.getBoundingClientRect().top + window.scrollY, h: s.offsetHeight })),
  );
  for (const s of sheets) {
    if (s.id === 'planta') continue;
    if (s.id === 'projeto' && vp.name === 'desktop') {
      const track = await page.evaluate(() => {
        const t = document.querySelector('.tl__track');
        return { top: t.getBoundingClientRect().top + window.scrollY, h: t.offsetHeight };
      });
      await scrollTo(page, s.top);
      await page.screenshot({ path: `${OUT}/${vp.name}-${s.id}-a.png` });
      for (const [k, p] of [['b', 0.1], ['c', 0.5], ['d', 0.7], ['e', 0.95]]) {
        await scrollTo(page, track.top + (track.h - vh) * p);
        await page.screenshot({ path: `${OUT}/${vp.name}-${s.id}-${k}.png` });
      }
      await scrollTo(page, track.top + track.h - vh * 0.2);
      await page.screenshot({ path: `${OUT}/${vp.name}-${s.id}-specs.png` });
      continue;
    }
    const shots = Math.min(4, Math.ceil(s.h / vh));
    for (let i = 0; i < shots; i++) {
      await scrollTo(page, s.top + i * vh * 0.9);
      await page.screenshot({ path: `${OUT}/${vp.name}-${s.id}-${String.fromCharCode(97 + i)}.png` });
    }
  }

  // Linha de serviço aberta.
  const servicos = sheets.find((s) => s.id === 'servicos');
  await scrollTo(page, servicos.top);
  await page.click('#servico-01-btn');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${vp.name}-servicos-aberto.png` });

  // Índice aberto.
  await page.click('[data-index-toggle]', { force: true }).catch(async () => {
    await scrollTo(page, servicos.top - 200, 400);
    await page.click('[data-index-toggle]');
  });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${OUT}/${vp.name}-indice.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  if (vp.name === 'desktop') {
    await page.keyboard.press('g');
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/${vp.name}-grelha.png` });
    await page.keyboard.press('g');
  }

  // 404 (o próprio documento responde 404: não é erro).
  page.removeAllListeners('console');
  await page.goto(BASE + '/folha-inexistente');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${vp.name}-404.png` });
  await context.close();
}
await browser.close();
if (errors.length) {
  console.log('Erros no console:\n' + [...new Set(errors)].join('\n'));
  process.exitCode = 1;
} else console.log(`Screenshots em ${OUT}. Console sem erros.`);
