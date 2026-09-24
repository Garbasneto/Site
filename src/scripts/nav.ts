/*
  Barra superior: some ao rolar para baixo, volta ao rolar para cima.
  Ganha fundo de papel quando sai do topo.
*/

import { ScrollTrigger } from './motion';

export function initNav() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;
  let last = window.scrollY;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > 8);
      if (y < 80) nav.classList.remove('is-hidden');
      else if (Math.abs(y - last) > 4) nav.classList.toggle('is-hidden', y > last);
      last = y;
    },
  });
}
