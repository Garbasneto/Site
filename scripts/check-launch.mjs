/*
  Verificação antes de publicar: lê o build de produção (.vercel/output/static) e lista,
  página a página, o que ainda está como [PREENCHER], qualquer marca de EXEMPLO
  (não deve haver nenhuma) e travessões ou meias-riscas no texto final.
  Uso: npm run build && npm run check:launch
*/

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('../.vercel/output/static', import.meta.url).pathname;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
// Texto visível e atributos lidos por pessoas (alt, aria-label, placeholder, title, content).
const text = (html) =>
  decode(
    html
      .replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, ' ')
      .replace(/\s(?:alt|aria-label|placeholder|title|content)="([^"]*)"/g, ' $1 ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  );

let files;
try {
  files = await walk(ROOT);
} catch {
  console.log('Sem build. Rode antes: npm run build');
  process.exit(1);
}

const placeholders = new Map();
const problems = [];
for (const f of files.sort()) {
  const page = f.replace(ROOT, '').replace(/(\/index)?\.html$/, '') || '/';
  const t = text(await readFile(f, 'utf8'));
  if (/\bEXEMPLO\b|\bEXAMPLE\b|\bEJEMPLO\b/.test(t)) problems.push(`${page}: marca de exemplo no build`);
  if (/[—–]/.test(t)) problems.push(`${page}: travessão ou meia-risca`);
  for (const m of t.matchAll(/\[PREENCHER:\s*([^\]]+)\]/g)) {
    const key = m[1].trim();
    if (!placeholders.has(key)) placeholders.set(key, new Set());
    placeholders.get(key).add(page);
  }
}

console.log(`Páginas verificadas: ${files.length}`);
console.log(problems.length ? `Problemas:\n  ${problems.join('\n  ')}` : 'Sem marcas de exemplo e sem travessões no build.');
if (placeholders.size) {
  console.log(`\nAinda por preencher (${placeholders.size}):`);
  for (const [k, pages] of [...placeholders].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  [PREENCHER: ${k}]  em ${[...pages].join(', ')}`);
} else console.log('\nNada por preencher.');
if (problems.length) process.exitCode = 1;
