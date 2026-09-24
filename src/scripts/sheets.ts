/*
  Estado da página por folha:
  - camada escura: o fundo passa para grafite nas folhas escuras (uma camada ganhando opacidade);
  - indicador fixo "F.03/08 · MÉTODO" (desktop);
  - barra "Iniciar projeto" no celular, depois do hero, até o CTA final entrar.
*/

import { EASE, gsap, media, ScrollTrigger } from './motion';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export function initSheets() {
  const html = document.documentElement;
  const layer = document.querySelector<HTMLElement>('[data-dark-layer]');
  const darkSheets = [...document.querySelectorAll<HTMLElement>('[data-dark]')];
  const reduced = media.reduced.matches;
  const nav = document.querySelector<HTMLElement>('[data-nav]');

  if (layer && !reduced) html.classList.add('has-dark-layer');

  let lastOpacity = -1;
  const updateDark = () => {
    const vh = window.innerHeight;
    let o = 0;
    if (!reduced) {
      for (const s of darkSheets) {
        const r = s.getBoundingClientRect();
        const enter = clamp((vh * 0.85 - r.top) / (vh * 0.4));
        const exit = clamp((r.bottom - vh * 0.15) / (vh * 0.4));
        o = Math.max(o, Math.min(enter, exit));
      }
      if (layer && Math.abs(o - lastOpacity) > 0.002) {
        layer.style.opacity = o.toFixed(3);
        lastOpacity = o;
      }
      html.classList.toggle('on-dark', o > 0.5);
    } else {
      // Sem movimento: vale o que está sob a barra superior.
      const y = (nav?.offsetHeight ?? 64) / 2;
      html.classList.toggle(
        'on-dark',
        darkSheets.some((s) => {
          const r = s.getBoundingClientRect();
          return r.top <= y && r.bottom >= y;
        }),
      );
    }
  };

  // Indicador de folha.
  const indicator = document.querySelector<HTMLElement>('[data-sheet-indicator]');
  const indicatorText = document.querySelector<HTMLElement>('[data-sheet-indicator-text]');
  let code = indicatorText?.textContent ?? '';
  const setCode = (next: string) => {
    if (!indicatorText || next === code) return;
    code = next;
    indicatorText.textContent = next;
    if (!reduced) gsap.fromTo(indicatorText, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: EASE });
  };
  document.querySelectorAll<HTMLElement>('[data-sheet-code]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && setCode(sec.dataset.sheetCode!),
    });
  });

  // Barra de CTA no celular.
  const bar = document.querySelector<HTMLAnchorElement>('[data-mobile-cta]');
  const heroTrack = document.querySelector<HTMLElement>('[data-hero-track]');
  const closing = document.querySelector<HTMLElement>('#iniciar');
  const stamp = document.querySelector<HTMLElement>('.stamp');
  let barOn = false;
  const setBar = (on: boolean) => {
    if (!bar || on === barOn) return;
    barOn = on;
    bar.classList.toggle('is-visible', on);
    bar.toggleAttribute('aria-hidden', !on);
    bar.tabIndex = on ? 0 : -1;
  };

  const update = () => {
    updateDark();
    const y = window.scrollY;
    const vh = window.innerHeight;
    const trackH = heroTrack?.offsetHeight ?? vh;
    // O botão do hero sai de cena no começo do trecho fixo (ou com o próprio hero, sem movimento).
    const heroGone = html.classList.contains('motion') ? y > 0.12 * (trackH - vh) + 40 : y > trackH - vh * 0.4;
    const closingIn = closing ? closing.getBoundingClientRect().top < vh * 0.9 : false;
    setBar(heroGone && !closingIn);
    // O carimbo do rodapé já diz "Folha 08/08": o indicador sai quando ele entra.
    const stampIn = stamp ? stamp.getBoundingClientRect().top < vh - 40 : false;
    indicator?.classList.toggle('is-visible', heroGone && !stampIn);
  };

  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: update });
  window.addEventListener('resize', update, { passive: true });
  update();
}
