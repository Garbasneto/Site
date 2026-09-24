/*
  Revelações das folhas ao entrar na tela (uma vez):
  - títulos e linhas de apoio: por máscara, linha a linha;
  - rótulos: opacidade;
  - itens de lista e fios de tabela: sobem e se desenham em sequência.
*/

import { EASE, gsap, media, SplitText } from './motion';

const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

export async function initReveals() {
  if (media.reduced.matches) return;

  // Em lotes pequenos, cedendo o processador entre eles.
  const titles = [...document.querySelectorAll<HTMLElement>('[data-reveal="lines"]')];
  for (let i = 0; i < titles.length; i++) {
    if (i && i % 3 === 0) await yieldToMain();
    const el = titles[i];
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'rl',
      aria: 'none',
      autoSplit: true,
      onSplit: (self: SplitText) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.1,
          stagger: 0.08,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  }
  await yieldToMain();

  document.querySelectorAll<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
    gsap.from(el, { autoAlpha: 0, duration: 0.9, ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // Itens de lista fora das linhas fechadas (essas animam ao abrir).
  const groups = new Map<Element, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>('[data-reveal-item]').forEach((el) => {
    if (el.closest('[data-row-panel]')) return;
    const parent = el.parentElement!;
    groups.set(parent, [...(groups.get(parent) ?? []), el]);
  });
  groups.forEach((els, parent) => {
    gsap.from(els, { autoAlpha: 0, y: 16, duration: 0.9, stagger: 0.06, ease: EASE, scrollTrigger: { trigger: parent, start: 'top 85%', once: true } });
  });

  // Fios das linhas de Serviços e Perguntas se desenham em sequência.
  document.querySelectorAll<HTMLElement>('[data-rows]').forEach((group) => {
    gsap.from(group.querySelectorAll('.row__rule'), {
      scaleX: 0,
      duration: 1.2,
      stagger: 0.06,
      ease: EASE,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true },
    });
  });
}
