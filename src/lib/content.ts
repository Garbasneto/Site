import { getCollection, getEntry } from 'astro:content';
import type { Locale } from '../i18n';

export async function getHome(lang: Locale) {
  const entry = await getEntry('home', lang);
  if (!entry) throw new Error(`Conteúdo da home não encontrado para "${lang}" (src/content/home/${lang}.yaml).`);
  return entry.data;
}

export type Home = Awaited<ReturnType<typeof getHome>>;
export type SheetId = Home['sheets'][number]['id'];

/**
  Cases e depoimentos não publicados aparecem só em desenvolvimento (com a marca "EXEMPLO").
  No build de produção, somem. PUBLIC_DRAFTS=off no dev mostra o site como vai ao ar (usado por npm run og).
*/
export const showDrafts = import.meta.env.DEV && import.meta.env.PUBLIC_DRAFTS !== 'off';

export async function getCases() {
  const all = await getCollection('cases');
  return all
    .filter((c) => c.data.publicado || showDrafts)
    .sort((a, b) => a.data.ordem - b.data.ordem)
    .map((c) => ({ id: c.id, draft: !c.data.publicado, ...c.data }));
}

export async function getTestimonials() {
  const all = await getCollection('depoimentos');
  return all
    .filter((t) => t.data.publicado || showDrafts)
    .sort((a, b) => a.data.ordem - b.data.ordem)
    .map((t) => ({ id: t.id, draft: !t.data.publicado, ...t.data }));
}

export type CaseItem = Awaited<ReturnType<typeof getCases>>[number];
export type TestimonialItem = Awaited<ReturnType<typeof getTestimonials>>[number];

export interface NumberedSheet {
  id: SheetId;
  label: string;
  title: string;
  /** "01", "02"... */
  number: string;
}

/**
  Numera as folhas visíveis. Uma folha sem conteúdo publicado (ex.: Resultados sem nenhum case)
  sai da lista e as seguintes sobem de número.
*/
export function numberSheets(sheets: Home['sheets'], hidden: SheetId[] = []): { list: NumberedSheet[]; total: string } {
  const visible = sheets.filter((s) => !hidden.includes(s.id));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    list: visible.map((s, i) => ({ ...s, number: pad(i + 1) })),
    total: pad(visible.length),
  };
}

/** "41°09′N 8°37′W" */
export function formatCoords(lat: number, lng: number): string {
  const part = (v: number, pos: string, neg: string) => {
    const a = Math.abs(v);
    const d = Math.floor(a);
    const m = Math.round((a - d) * 60);
    return `${d}°${String(m).padStart(2, '0')}′${v >= 0 ? pos : neg}`;
  };
  return `${part(lat, 'N', 'S')} ${part(lng, 'E', 'W')}`;
}

/** Troca {chaves} num texto: fill("Dias {from} a {to}", { from: 1, to: 4 }). */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
}

/** Um texto ainda sem dado real. */
export const isPlaceholder = (v: unknown) => typeof v === 'string' && v.includes('[PREENCHER');
