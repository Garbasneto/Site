/*
  F.05 · Palavra de cliente: um depoimento por vez. Setas, teclado e arraste.
  Troca por máscara de linha. Sem autoplay.
*/

import { EASE, gsap, media, SplitText } from './motion';

export function initTestimonials() {
  const root = document.querySelector<HTMLElement>('[data-testimonials]');
  if (!root) return;
  const items = [...root.querySelectorAll<HTMLElement>('[data-tm]')];

  // Vídeo opcional: a capa vira o player ao tocar.
  root.querySelectorAll<HTMLButtonElement>('[data-video]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const url = btn.dataset.video!;
      const el = /\.(mp4|webm)(\?|$)/.test(url) ? document.createElement('video') : document.createElement('iframe');
      if (el instanceof HTMLVideoElement) {
        el.src = url;
        el.controls = true;
        el.autoplay = true;
        el.playsInline = true;
      } else {
        el.src = url;
        el.allow = 'autoplay; fullscreen; picture-in-picture';
        el.title = btn.textContent?.trim() || '';
      }
      el.className = btn.className;
      btn.replaceWith(el);
    }),
  );

  if (items.length < 2) return;
  const current = root.querySelector<HTMLElement>('[data-tm-current]');
  const reduced = media.reduced.matches;
  const splits = new Map<HTMLElement, Element[]>();
  const lines = (item: HTMLElement): Element[] => {
    if (!splits.has(item)) {
      const text = item.querySelector<HTMLElement>('[data-tm-text]')!;
      const s = SplitText.create(text, { type: 'lines', mask: 'lines', linesClass: 'tml', aria: 'none' });
      splits.set(item, [...s.lines, item.querySelector('figcaption')!]);
    }
    return splits.get(item)!;
  };

  let index = 0;
  let busy = false;
  const pad = (n: number) => String(n).padStart(2, '0');

  const go = (next: number) => {
    next = (next + items.length) % items.length;
    if (busy || next === index) return;
    const dir = next > index ? 1 : -1;
    const cur = items[index];
    const nxt = items[next];
    index = next;
    if (current) current.textContent = pad(next + 1);
    if (reduced) {
      cur.classList.remove('is-active');
      nxt.classList.add('is-active');
      return;
    }
    busy = true;
    nxt.classList.add('is-active');
    const out = lines(cur);
    const inn = lines(nxt);
    gsap
      .timeline({
        onComplete: () => {
          cur.classList.remove('is-active');
          gsap.set(out, { clearProps: 'transform,opacity' });
          busy = false;
        },
      })
      .fromTo(out, { yPercent: 0 }, { yPercent: -105 * dir, duration: 0.5, stagger: 0.03, ease: EASE }, 0)
      .fromTo(inn, { yPercent: 105 * dir }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: EASE }, 0.2);
  };

  root.querySelector('[data-tm-prev]')?.addEventListener('click', () => go(index - 1));
  root.querySelector('[data-tm-next]')?.addEventListener('click', () => go(index + 1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  });

  // Arraste horizontal.
  const stage = root.querySelector<HTMLElement>('[data-tm-stage]')!;
  let x0: number | null = null;
  let y0 = 0;
  stage.addEventListener('pointerdown', (e) => {
    x0 = e.clientX;
    y0 = e.clientY;
  });
  stage.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', () => (x0 = null));
}
