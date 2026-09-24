/*
  Verifica as regras de copy (CLAUDE.md, seção "Copy") nos arquivos de conteúdo.
  - Nenhum travessão (U+2014) ou meia-risca (U+2013) em todo o src/.
  - Nenhum hífen duplo ou hífen solto fazendo papel de travessão nos textos.
  - Nenhuma palavra proibida, por idioma.
  Uso: npm run check:copy
*/

import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

/** Palavra inteira, com limites que entendem acentos. */
const w = (src) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${src})(?![\\p{L}\\p{N}])`, 'iu');

const banned = {
  pt: [
    w('sistemas?'),
    w('máquinas?'),
    w('a gente'),
    w('transformar espaços'),
    w('casa dos sonhos'),
    w('alavanc\\w*'),
    w('potencializ\\w*'),
    w('próximo nível'),
    w('soluç(ão|ões)'),
    w('inovador\\w*'),
    w('jornadas?'),
    w('desbloque\\w*'),
    w('no mundo de hoje'),
    w('não é só.*é'),
    w('vocês?'),
    w('tu'),
    // Palavras que mudam entre Portugal e Brasil.
    w('contat[oa]s?|contact[oa]s?'),
    w('equipes?|equipas?'),
    w('celular(es)?|telemóve(l|is)'),
    w('registros?|registos?'),
    w('conosco|connosco'),
    w('arquivos?|ficheiros?'),
    w('telas?|ecrãs?'),
  ],
  en: [
    w('systems?'),
    w('machines?'),
    w('transform(ing)? spaces'),
    w('dream homes?'),
    w('leverag\\w*'),
    w('empower\\w*'),
    w('next level'),
    w('solutions?'),
    w('innovat\\w*'),
    w('journeys?'),
    w('unlock\\w*'),
    w('in today\'?s world'),
    w('not just'),
  ],
  es: [
    w('sistemas?'),
    w('máquinas?'),
    w('transformar espacios'),
    w('casa de (tus|sus) sueños'),
    w('apalanc\\w*'),
    w('potenci(ar|a|amos)'),
    w('(siguiente|próximo) nivel'),
    w('soluci(ón|ones)'),
    w('innovador\\w*'),
    w('desbloque\\w*'),
    w('en el mundo de hoy'),
    w('no es solo'),
    w('usted(es)?'),
  ],
};

const DASHES = /[—–]/;
const FAKE_DASH = /(\s-\s|--)/;

function langOf(file) {
  const m = file.match(/(?:^|[/._-])(pt|en|es)(?:[/._-]|$)/);
  return m ? m[1] : null;
}

const problems = [];
const files = (await walk(join(ROOT, 'src'))).filter((f) => ['.yaml', '.yml', '.md', '.mdx', '.json', '.astro', '.ts'].includes(extname(f)));

for (const file of files) {
  const rel = file.replace(ROOT, '');
  const lines = (await readFile(file, 'utf8')).split('\n');
  const isContent = rel.startsWith('src/content/');
  const lang = isContent ? langOf(rel) : null;
  lines.forEach((line, i) => {
    const where = `${rel}:${i + 1}`;
    if (DASHES.test(line)) problems.push(`${where}  travessão ou meia-risca`);
    if (!isContent) return;
    // Só o texto entre aspas conta (ignora chaves do YAML e comentários).
    const text = line.trim().startsWith('#') ? '' : line.replace(/^\s*-\s+/, '').replace(/^[^:"]*:\s*/, '');
    if (FAKE_DASH.test(text)) problems.push(`${where}  hífen fazendo papel de travessão`);
    for (const re of banned[lang] ?? []) {
      if (re.test(text)) problems.push(`${where}  palavra proibida (${re.source})`);
    }
  });
}

if (problems.length) {
  console.log(`Regras de copy: ${problems.length} problema(s)\n` + problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Regras de copy: ok (${files.length} arquivos verificados).`);
}
