/*
  F.04 · Resultados: números contam ao entrar, fotos se revelam por máscara, a linha de evolução
  se desenha, e o índice fixo marca o case em leitura.
*/

import { EASE, gsap, lenis, media, ScrollTrigger } from './motion';

export function initResults() {
  const root = document.querySelector<HTMLElement>('#resultados');
  if (!root) return;
  const reduced = media.reduced.matches;

  if (!reduced) {
    root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const decimals = Number(el.dataset.decimals || 0);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const locale = el.dataset.locale || 'pt-PT';
      const format = (v: number) =>
        prefix + v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      const state = { v: 0 };
      el.textContent = format(0);
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => gsap.to(state, { v: target, duration: 1.4, ease: EASE, onUpdate: () => (el.textContent = format(state.v)) }),
      });
    });

    root.querySelectorAll<HTMLElement>('[data-reveal="mask"]').forEach((wrap) => {
      const img = wrap.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { yPercent: 101 }, { yPercent: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    });

    root.querySelectorAll<SVGElement>('[data-draw]').forEach((line) => {
      gsap.fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: EASE, scrollTrigger: { trigger: line, start: 'top 85%', once: true } });
    });
  }

  // Índice fixo: marca o case em leitura e rola até ele.
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-case-link]')];
  const setActive = (id: string) => links.forEach((a) => a.classList.toggle('is-active', a.dataset.caseLink === id));
  root.querySelectorAll<HTMLElement>('[data-case]').forEach((article) => {
    ScrollTrigger.create({
      trigger: article,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && setActive(article.dataset.case!),
    });
  });
  links.forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = document.getElementById(`case-${a.dataset.caseLink}`);
      if (!target || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -96 });
    }),
  );
}
