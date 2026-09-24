/* Botão magnético (só com mouse): aproxima-se do cursor alguns pixels, sem esconder nada. */

import { EASE, gsap } from './motion';

export function initMagnetic(btn: HTMLElement | null, reach = 70) {
  if (!btn) return;
  const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: EASE });
  const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: EASE });
  let near = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const inside = Math.abs(dx) < r.width / 2 + reach && Math.abs(dy) < r.height / 2 + reach;
      if (!inside && !near) return;
      near = inside;
      xTo(inside ? gsap.utils.clamp(-10, 10, dx * 0.08) : 0);
      yTo(inside ? gsap.utils.clamp(-8, 8, dy * 0.22) : 0);
    },
    { passive: true },
  );
}
