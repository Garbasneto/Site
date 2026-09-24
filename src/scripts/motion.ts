/*
  Base de movimento do site: GSAP, ScrollTrigger, SplitText e Lenis.
  Lenis só com mouse (desktop). No toque, scroll nativo.
  Com prefers-reduced-motion: nada anima, nada suaviza.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** A única curva de transição do site (família expo out). */
export const EASE = 'expo.out';
export const DUR = { short: 0.6, base: 0.9, long: 1.2 } as const;

export const media = {
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)'),
  fine: window.matchMedia('(hover: hover) and (pointer: fine)'),
  desktop: window.matchMedia('(min-width: 768px)'),
};

export let lenis: Lenis | null = null;

export function initMotion() {
  gsap.defaults({ ease: EASE, duration: DUR.base });
  // A barra de endereço do navegador do Instagram/Safari aparece e some: não recalcular por isso.
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (media.reduced.matches) return;

  if (media.fine.matches) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(2, -10 * t),
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

export { gsap, ScrollTrigger, SplitText };
