/*
  Linhas que abrem e fecham (Serviços e Perguntas): uma aberta por vez por grupo.
  Ao abrir, o conteúdo sobe por máscara e o desenho técnico se desenha.
*/

import { EASE, gsap, media, ScrollTrigger } from './motion';

let refreshTimer = 0;
const refreshSoon = () => {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 60);
};

function setOpen(row: HTMLElement, open: boolean) {
  const btn = row.querySelector<HTMLButtonElement>('[data-row-toggle]');
  row.classList.toggle('is-open', open);
  btn?.setAttribute('aria-expanded', String(open));
  if (!open || media.reduced.matches) return;

  const panel = row.querySelector<HTMLElement>('[data-row-panel]');
  if (!panel) return;
  const blocks = panel.querySelectorAll<HTMLElement>('.label, li, p');
  gsap.fromTo(blocks, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.05, ease: EASE, overwrite: true });
  const lines = panel.querySelectorAll<SVGElement>('[data-drawing] path, [data-drawing] circle:not(.dot)');
  if (lines.length) {
    gsap.fromTo(lines, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, stagger: 0.07, ease: EASE, delay: 0.1, overwrite: true });
    const dots = panel.querySelectorAll<SVGElement>('[data-drawing] .dot');
    gsap.fromTo(dots, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: EASE, delay: 0.7, overwrite: true });
  }
}

export function initRows() {
  document.querySelectorAll<HTMLElement>('[data-rows]').forEach((group) => {
    const rows = [...group.querySelectorAll<HTMLElement>('[data-row]')];
    rows.forEach((row) => {
      row.querySelector('[data-row-toggle]')?.addEventListener('click', () => {
        const willOpen = !row.classList.contains('is-open');
        rows.forEach((r) => r !== row && r.classList.contains('is-open') && setOpen(r, false));
        setOpen(row, willOpen);
        // A altura da página mudou: os trechos fixos abaixo precisam recalcular.
        refreshSoon();
      });
    });
  });
}
