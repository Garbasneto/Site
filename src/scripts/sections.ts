/* Tudo o que vem depois do hero. Carregado à parte, depois da primeira pintura. */

import { gsap, media } from './motion';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { initRows } from './rows';
import { initTimeline } from './timeline';
import { initResults } from './results';
import { initTestimonials } from './testimonials';
import { initSheets } from './sheets';
import { initSheetIndex } from './sheet-index';
import { initGrid } from './grid';
import { initReveals } from './reveal';
import { initMagnetic } from './magnetic';

gsap.registerPlugin(DrawSVGPlugin);

const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

/** Uma etapa por tarefa: nenhuma trava a página por muito tempo. */
export async function initSections() {
  const steps: (() => unknown)[] = [
    initSheetIndex,
    initSheets,
    initRows,
    initTimeline,
    initResults,
    initTestimonials,
    initGrid,
    () => media.fine.matches && !media.reduced.matches && initMagnetic(document.querySelector<HTMLElement>('[data-cta="final"]')),
    initReveals,
  ];
  for (const step of steps) {
    await step();
    await yieldToMain();
  }
}
