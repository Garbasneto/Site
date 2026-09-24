/*
  Sugere, numa linha discreta, a versão no idioma do navegador. Nunca redireciona.
  Aparece só depois da escolha de cookies (uma nota de cada vez) e some para sempre ao fechar.
  Fica só no topo da página: ao descer, sai da frente da planta; ao voltar ao topo, reaparece.
*/

import { getConsent } from './consent';

const KEY = 'hp-lang-dismissed';

export function initLangSuggest() {
  const el = document.querySelector<HTMLElement>('[data-lang-suggest]');
  if (!el) return;
  const current = document.documentElement.lang.slice(0, 2);
  const wanted = (navigator.languages?.[0] || navigator.language || '').slice(0, 2).toLowerCase();
  if (!['pt', 'en', 'es'].includes(wanted) || wanted === current) return;
  try {
    if (localStorage.getItem(KEY)) return;
  } catch {
    /* sem armazenamento */
  }
  const option = el.querySelector<HTMLElement>(`[data-lang-option="${wanted}"]`);
  if (!option) return;

  let away = false;
  const onScroll = () => {
    const next = window.scrollY > window.innerHeight * 0.35;
    if (next !== away) el.classList.toggle('is-away', (away = next));
  };
  const show = () => {
    option.hidden = false;
    el.hidden = false;
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  };
  el.querySelector('[data-lang-dismiss]')?.addEventListener('click', () => {
    el.hidden = true;
    window.removeEventListener('scroll', onScroll);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* nada */
    }
  });
  if (getConsent()) show();
  else document.addEventListener('hp:consent', show, { once: true });
}
