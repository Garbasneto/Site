/*
  F.03 · Projeto de 90 dias.
  Desktop: trecho fixo; o scroll percorre as cinco fases em partes iguais e o marcador anda na cota
  pelos dias reais de cada fase. O conteúdo troca por máscara.
  Celular: a cota vertical se preenche ao rolar.
*/

import { EASE, gsap, ScrollTrigger } from './motion';

export function initTimeline() {
  const root = document.querySelector<HTMLElement>('[data-timeline]');
  if (!root) return;
  const phases = JSON.parse(root.dataset.phases || '[]') as { from: number; to: number }[];
  const items = [...root.querySelectorAll<HTMLElement>('[data-phase]')];
  const segs = [...root.querySelectorAll<HTMLElement>('[data-seg]')];
  const fill = root.querySelector<HTMLElement>('[data-tl-fill]');
  const marker = root.querySelector<HTMLElement>('[data-tl-marker]');
  const line = root.querySelector<HTMLElement>('.tl__line');
  const rail = root.querySelector<HTMLElement>('[data-tl-rail]');
  const track = root.querySelector<HTMLElement>('.tl__track');
  const list = root.querySelector<HTMLElement>('[data-tl-phases]');
  const readout = root.querySelector<HTMLElement>('[data-tl-day]');

  const mm = gsap.matchMedia();
  mm.add(
    {
      desk: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
      mob: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { desk } = ctx.conditions as { desk: boolean; mob: boolean };
      if (!desk) {
        if (rail && list) {
          gsap.fromTo(
            rail,
            { scaleY: 0 },
            { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 75%', end: 'bottom 75%', scrub: 0.4 } },
          );
        }
        return;
      }

      let active = -1;
      let lineWidth = line?.offsetWidth ?? 0;
      const parts = (el: HTMLElement) => el.querySelectorAll<HTMLElement>('[data-tl-part]');

      const setActive = (i: number, animate = true) => {
        if (i === active) return;
        const prev = active;
        active = i;
        segs.forEach((s, k) => s.classList.toggle('is-active', k === i));
        const next = items[i];
        next.classList.add('is-active');
        if (!animate || prev < 0) {
          items.forEach((el, k) => k !== i && el.classList.remove('is-active'));
          gsap.set(parts(next), { yPercent: 0 });
          return;
        }
        const old = items[prev];
        const dir = i > prev ? 1 : -1;
        gsap.killTweensOf([...parts(old), ...parts(next)]);
        gsap.to(parts(old), {
          yPercent: -105 * dir,
          duration: 0.45,
          stagger: 0.03,
          ease: EASE,
          onComplete: () => {
            if (active !== prev) old.classList.remove('is-active');
          },
        });
        gsap.fromTo(parts(next), { yPercent: 105 * dir }, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: EASE, delay: 0.12 });
      };
      setActive(0, false);

      const st = ScrollTrigger.create({
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        onRefresh: () => {
          lineWidth = line?.offsetWidth ?? 0;
        },
        onUpdate(self) {
          const n = phases.length;
          const p = self.progress * n;
          const i = Math.min(n - 1, Math.floor(p));
          const local = Math.min(1, Math.max(0, p - i));
          const day = phases[i].from + (phases[i].to - phases[i].from) * local;
          const x = day / 90;
          if (fill) gsap.set(fill, { scaleX: x });
          if (marker) gsap.set(marker, { x: x * lineWidth });
          if (readout) readout.textContent = String(Math.round(day)).padStart(2, '0');
          setActive(i);
        },
      });
      return () => st.kill();
    },
  );
}
