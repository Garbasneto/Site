/*
  Índice de folhas em tela cheia. Abre pelo botão "Índice"; Esc ou "Fechar" fecha.
  Foco preso dentro enquanto aberto e devolvido ao botão depois.
*/

import { EASE, gsap, lenis, media } from './motion';

export function initSheetIndex() {
  const panel = document.querySelector<HTMLElement>('[data-sheet-index]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-index-toggle]');
  if (!panel || !toggle) return;
  const close = panel.querySelector<HTMLButtonElement>('[data-index-close]')!;
  const reduced = media.reduced.matches;
  let open = false;

  const focusables = () =>
    [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null);

  const show = () => {
    if (open) return;
    open = true;
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('index-open');
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    if (reduced) {
      close.focus({ preventScroll: true });
      return;
    }
    const rules = panel.querySelectorAll('.sindex__rule');
    const titles = panel.querySelectorAll('.sindex__t');
    const meta = panel.querySelectorAll('.sindex__n, .sindex__l, .sindex__foot, .sindex__bar');
    gsap.timeline()
      .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0)
      .fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1, stagger: 0.05, ease: EASE }, 0.05)
      .fromTo(titles, { yPercent: 105 }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: EASE }, 0.12)
      .fromTo(meta, { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.02, ease: 'none' }, 0.2);
    close.focus({ preventScroll: true });
  };

  const hide = (restoreFocus = true) => {
    if (!open) return;
    open = false;
    toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('index-open');
    document.body.style.overflow = '';
    lenis?.start();
    const done = () => {
      panel.hidden = true;
      if (restoreFocus) toggle.focus({ preventScroll: true });
    };
    if (reduced) return done();
    gsap.to(panel, { opacity: 0, duration: 0.3, ease: 'none', onComplete: done });
  };

  toggle.addEventListener('click', () => (open ? hide() : show()));
  close.addEventListener('click', () => hide());
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
      return;
    }
    if (e.key !== 'Tab') return;
    const list = focusables();
    const first = list[0];
    const last = list[list.length - 1];
    if (!panel.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  panel.querySelectorAll<HTMLAnchorElement>('[data-index-link]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      hide(false);
      const top = id === 'planta' ? 0 : target;
      if (lenis) lenis.scrollTo(top, { immediate: reduced, duration: 1.4 });
      else if (top === 0) window.scrollTo({ top: 0 });
      else target.scrollIntoView();
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }),
  );
}
