/*
  F.01 · Planta. Orquestra o desenho da planta, os leads, o cursor de CAD,
  o botão magnético e o trecho fixo com a extrusão e o manifesto.
*/

import { EASE, gsap, media, ScrollTrigger, SplitText } from './motion';
import { buildPlan, type BuiltPlan } from '../lib/plan/geometry';
import { LeadFlow } from '../lib/plan/leads';
import { PlanRenderer, type PlanText, type Region, type RenderState } from '../lib/plan/renderer';
import { landscape, portrait } from '../data/plan';
import { formatSheetDate, type Locale } from '../i18n';

interface HeroData {
  lang: Locale;
  decimal: string;
  text: PlanText;
}

export function initHero(): (() => void) | undefined {
  const root = document.querySelector<HTMLElement>('.hero');
  if (!root) return;
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const track = q<HTMLElement>('[data-hero-track]');
  const frame = q<HTMLElement>('[data-hero-frame]');
  const canvas = q<HTMLCanvasElement>('[data-hero-canvas]');
  const leadsCanvas = q<HTMLCanvasElement>('[data-hero-leads]');
  const leadsCtx = leadsCanvas.getContext('2d')!;
  const sheet = q<HTMLElement>('[data-hero-sheet]');
  const manifesto = q<HTMLElement>('[data-hero-manifesto]');
  const manifestoInner = q<HTMLElement>('.hero__manifesto-inner');
  const data = JSON.parse(q<HTMLScriptElement>('[data-hero-data]').textContent || '{}') as HeroData;

  // Carimbo: a data do dia, no navegador.
  const dateEl = root.querySelector<HTMLTimeElement>('[data-sheet-date]');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = formatSheetDate(now, data.lang);
    dateEl.dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  const reduced = media.reduced.matches;
  const cache: Partial<Record<'landscape' | 'portrait', BuiltPlan>> = {};
  const getPlan = (p: boolean): BuiltPlan =>
    p ? (cache.portrait ??= buildPlan(portrait)) : (cache.landscape ??= buildPlan(landscape));
  const wantsPortrait = () => window.innerWidth < 768 || window.innerHeight > window.innerWidth * 1.15;
  let isPortrait = wantsPortrait();
  let plan = getPlan(isPortrait);

  const renderer = new PlanRenderer(canvas, plan, data.text);
  let flow = new LeadFlow(plan);
  let staticLeads = LeadFlow.staticLayout(plan);

  const state: RenderState = reduced
    ? { draw: 1, poche: 1, details: 1, annot: 1, labels: 1, turn: 0, lift: 0, dots: 1 }
    : { draw: 0, poche: 0, details: 0, annot: 0, labels: 0, turn: 0, lift: 0, dots: 0 };

  /* Enquadramento */

  let layoutVersion = 0;

  function layout() {
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.resize(w, h, dpr);
    leadsCanvas.width = Math.round(w * dpr);
    leadsCanvas.height = Math.round(h * dpr);
    layoutVersion++;

    const fr = frame.getBoundingClientRect();
    // Mede sem o deslocamento do scroll (o carimbo pode estar saindo de cena).
    const sheetRect = { left: sheet.offsetLeft, top: sheet.offsetTop, right: sheet.offsetLeft + sheet.offsetWidth };
    const m = Math.max(12, w - sheetRect.right);
    const navH = document.querySelector<HTMLElement>('[data-nav]')?.offsetHeight ?? 64;
    const inner = manifestoInner.getBoundingClientRect();
    const innerLeft = inner.left - fr.left;
    const innerRight = inner.right - fr.left;
    const innerTop = inner.top - fr.top;

    let flat: Region;
    let axo: Region;
    if (!isPortrait) {
      flat = { x: m, y: navH + 8, w: sheetRect.left - m - 32, h: h - navH - 8 - m };
      const ax = Math.max(innerRight + 48, w * 0.42);
      axo = { x: ax, y: navH + 24, w: w - m - ax, h: h - navH - 24 - m };
    } else {
      flat = { x: m, y: navH + 6, w: w - 2 * m, h: sheetRect.top - navH - 6 - 14 };
      axo = { x: Math.max(m, innerLeft), y: navH + 10, w: w - 2 * m, h: Math.max(160, innerTop - navH - 10 - 22) };
    }
    renderer.fit(flat, axo);
  }

  function switchPlanIfNeeded() {
    const next = wantsPortrait();
    if (next === isPortrait) return;
    isPortrait = next;
    plan = getPlan(isPortrait);
    renderer.setPlan(plan);
    flow = new LeadFlow(plan);
    flow.warmup(10);
    staticLeads = LeadFlow.staticLayout(plan);
  }

  /* Desenho */

  const draw = () => renderer.render(state, reduced ? staticLeads : flow.leads, reduced ? [] : flow.rings);

  // Planta parada (plana): desenha a planta uma vez e só os pontos a cada quadro, noutra camada.
  // Em movimento (axonometria): tudo num canvas só, porque as paredes escondem os pontos.
  let staticKey = '';
  let leadsLayerDirty = false;
  const frameDraw = () => {
    const flat = state.turn < 1e-4 && state.lift < 1e-4;
    if (flat) {
      const key = [state.draw, state.poche, state.details, state.annot, state.labels, layoutVersion].join('|');
      if (key !== staticKey) {
        renderer.render(state, null);
        staticKey = key;
      }
      renderer.renderLeadsOnly(leadsCtx, state, flow.leads, flow.rings);
      leadsLayerDirty = true;
    } else {
      staticKey = '';
      if (leadsLayerDirty) {
        renderer.clear(leadsCtx);
        leadsLayerDirty = false;
      }
      draw();
    }
  };

  let running = false;
  const tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 0.05);
    if (state.dots > 0) flow.update(dt);
    frameDraw();
  };
  const start = () => {
    if (running || reduced) return;
    running = true;
    gsap.ticker.add(tick);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
  };

  // Pausa quando o hero sai da tela.
  new IntersectionObserver(
    (entries) => {
      for (const e of entries) (e.isIntersecting ? start : stop)();
    },
    { rootMargin: '100px 0px' },
  ).observe(track);

  layout();

  // Rótulos em mono no canvas: garante a fonte antes de desenhar em definitivo.
  Promise.all([
    document.fonts.load('500 11px "Geist Mono"'),
    document.fonts.load('400 10px "Geist Mono"'),
  ])
    .catch(() => undefined)
    .then(() => {
      layout();
      if (reduced) draw();
    });

  if (reduced) {
    draw();
  } else {
    // Abertura: 0 a 1,6 s o desenho; 1,4 a 2 s os rótulos; depois os leads.
    gsap
      .timeline({ defaults: { ease: EASE } })
      .to(state, { draw: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to(state, { poche: 1, duration: 0.7 }, 0.7)
      .to(state, { details: 1, duration: 0.8 }, 0.8)
      .to(state, { annot: 1, duration: 0.9 }, 0.7)
      .to(state, { labels: 1, duration: 0.6 }, 1.4)
      .add(() => flow.warmup(1.2), 1.75)
      .to(state, { dots: 1, duration: 0.6 }, 1.8);
  }

  // Trecho fixo: a planta gira, inclina e ganha volume; o manifesto entra linha por linha.
  // Montado numa tarefa separada, para não travar a primeira pintura.
  const setupScroll = () => {
    if (reduced) return;
    const paragraphs = [...manifesto.querySelectorAll<HTMLElement>('[data-manifesto-line]')];
    SplitText.create(paragraphs, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'mline',
      // O texto continua inteiro para leitores de tela; sem aria-label em <p>.
      aria: 'none',
      autoSplit: true,
      onSplit(self: SplitText) {
        manifesto.classList.add('is-ready');
        const groups = paragraphs.map((p) => self.lines.filter((l) => p.contains(l)));
        // Estado inicial explícito: as linhas começam fora da máscara.
        gsap.set(self.lines, { yPercent: 110 });
        const tl = gsap.timeline({ defaults: { ease: 'none' } });
        tl.fromTo(sheet, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 28, duration: 0.1, ease: 'power1.in' }, 0.02)
          .fromTo(state, { turn: 0 }, { turn: 1, duration: 0.46, ease: 'sine.inOut' }, 0.04)
          .fromTo(state, { lift: 0 }, { lift: 1, duration: 0.42, ease: 'sine.inOut' }, 0.18)
          .to(groups[0], { yPercent: 0, duration: 0.12, stagger: 0.025, ease: EASE }, 0.24)
          .to(groups[1], { yPercent: 0, duration: 0.12, stagger: 0.025, ease: EASE }, 0.4)
          .to(groups[2], { yPercent: 0, duration: 0.1, stagger: 0.012, ease: EASE }, 0.55)
          .fromTo([canvas, leadsCanvas], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: () => -frame.clientHeight * 0.08, duration: 0.12, ease: 'power1.in' }, 0.88)
          .set({}, {}, 1);
        ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: media.fine.matches ? true : 0.5,
          animation: tl,
          invalidateOnRefresh: true,
        });
        return tl;
      },
    });
  };

  /* Redimensionamento */

  let lastW = window.innerWidth;
  let timer = 0;
  new ResizeObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      // No celular, a barra de endereço muda só a altura: ignora.
      if (!media.fine.matches && window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      switchPlanIfNeeded();
      layout();
      if (reduced) draw();
    }, 120);
  }).observe(frame);

  /* Cursor de CAD e botão magnético (só com mouse) */

  if (media.fine.matches) {
    const cursor = q<HTMLElement>('[data-hero-cursor]');
    const lineX = q<HTMLElement>('[data-cursor-x]');
    const lineY = q<HTMLElement>('[data-cursor-y]');
    const label = q<HTMLElement>('[data-cursor-label]');
    let px = 0;
    let py = 0;
    let queued = false;
    const fmt = (v: number) => (v < 0 ? '-' : ' ') + Math.abs(v).toFixed(1).padStart(4, '0').replace('.', data.decimal);
    const paint = () => {
      queued = false;
      lineX.style.transform = `translate3d(0, ${py}px, 0)`;
      lineY.style.transform = `translate3d(${px}px, 0, 0)`;
      const [x, y] = renderer.toPlan(px, py, state.turn);
      const [bx0, by0, bx1, by1] = renderer.bounds;
      const span = plan.def.dimensionAxis === 'x' ? bx1 - bx0 : by1 - by0;
      label.textContent = `X${fmt(((x - bx0) / span) * 90)}   Y${fmt(((y - by0) / span) * 90)}`;
      const flipX = px > frame.clientWidth - 150;
      const flipY = py > frame.clientHeight - 40;
      label.style.transform = `translate3d(${flipX ? px - 136 : px + 12}px, ${flipY ? py - 22 : py + 10}px, 0)`;
    };
    frame.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = frame.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      const overSheet = (e.target as Element).closest('[data-hero-sheet]');
      cursor.classList.toggle('is-on', !overSheet);
      if (!queued) {
        queued = true;
        requestAnimationFrame(paint);
      }
    });
    frame.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));

    if (!reduced) {
      const btn = q<HTMLElement>('[data-magnetic]');
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: EASE });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: EASE });
      const reach = 70;
      window.addEventListener(
        'pointermove',
        (e) => {
          const r = btn.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const inside = Math.abs(dx) < r.width / 2 + reach && Math.abs(dy) < r.height / 2 + reach;
          xTo(inside ? gsap.utils.clamp(-10, 10, dx * 0.08) : 0);
          yTo(inside ? gsap.utils.clamp(-8, 8, dy * 0.22) : 0);
        },
        { passive: true },
      );
    }
  }

  return setupScroll;
}
