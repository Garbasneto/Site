/* Tecla G (só desktop): mostra e esconde a grelha de 12 colunas. Não dispara com o foco num campo. */

import { media } from './motion';

export function initGrid() {
  const overlay = document.querySelector<HTMLElement>('[data-grid-overlay]');
  if (!overlay || !media.fine.matches) return;
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'g' && e.key !== 'G') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    overlay.hidden = !overlay.hidden;
  });
}
