import { initMotion } from './motion';
import { initNav } from './nav';
import { initHero } from './hero';

/** Cede o processador entre etapas da inicialização (menos tarefas longas, INP melhor). */
const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (s?.yield) s.yield().then(resolve);
    else setTimeout(resolve, 0);
  });

async function boot() {
  initMotion();
  const setupScroll = initHero();
  await yieldToMain();
  setupScroll?.();
  await yieldToMain();
  initNav();
}

boot();
