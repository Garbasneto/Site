/*
  Em todas as páginas: origem da visita, consentimento, eventos de clique e sugestão de idioma.
  Pequeno e sem dependências.
*/

import { campaignParams, captureAttribution } from './attribution';
import { initConsent } from './consent';
import { initLangSuggest } from './lang-suggest';
import { track } from './track';

captureAttribution();
initConsent();
initLangSuggest();

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const cta = target.closest<HTMLAnchorElement>('a[data-cta]');
  if (cta) {
    track('cta_click', { cta_position: cta.dataset.cta, cta_url: cta.href });
    // Formulário externo (Respondi): repassa as UTMs.
    if (cta.host && cta.host !== location.host) {
      const url = new URL(cta.href);
      campaignParams().forEach((v, k) => url.searchParams.set(k, v));
      cta.href = url.toString();
    }
  }
  const lang = target.closest<HTMLAnchorElement>('a[data-lang-link]');
  if (lang && lang.dataset.langLink !== document.documentElement.lang.slice(0, 2)) {
    track('language_change', { language_from: document.documentElement.lang.slice(0, 2), language_to: lang.dataset.langLink });
  }
  const wa = target.closest<HTMLAnchorElement>('a[data-whatsapp]');
  if (wa) track('whatsapp_click', { whatsapp_position: wa.dataset.whatsapp });
});
