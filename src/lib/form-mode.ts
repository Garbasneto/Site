/* Para onde os botões "Iniciar projeto" apontam: o formulário do site ou o Respondi (FORM_MODE=external). */

import { FORM_MODE } from 'astro:env/server';
import { site } from '../config/site';
import { path, type Locale } from '../i18n';

const respondiReady = !site.form.respondiUrl.includes('[PREENCHER');

export const formMode: 'native' | 'external' = FORM_MODE === 'external' && respondiReady ? 'external' : 'native';

export function startHref(lang: Locale): string {
  return formMode === 'external' ? site.form.respondiUrl : path('start', lang);
}
