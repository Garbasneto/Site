import { getEntry } from 'astro:content';
import type { Locale } from '../i18n';

export async function getHome(lang: Locale) {
  const entry = await getEntry('home', lang);
  if (!entry) throw new Error(`Conteúdo da home não encontrado para "${lang}" (src/content/home/${lang}.yaml).`);
  return entry.data;
}

export type Home = Awaited<ReturnType<typeof getHome>>;
export type SheetId = Home['sheets'][number]['id'];

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
