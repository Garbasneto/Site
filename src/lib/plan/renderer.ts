/*
  Desenha a planta em Canvas 2D, quadro a quadro.
  Um único desenho cobre todos os estados: traço sendo desenhado, poché, planta completa,
  rotação para a axonometria e extrusão das paredes.
*/

import { makeCamera, projectX, projectY, rx, ry, type Camera } from './camera';
import type { BuiltPlan, Face } from './geometry';
import { LeadFlow, type Lead, type Ring } from './leads';
import type { RoomKey, Vec2 } from './types';

export interface PlanText {
  rooms: Record<RoomKey, { number: string; name: string; metric: string }>;
  circulation: string;
  entrance: string;
  dimension: string;
  scaleUnit: string;
  north: string;
}

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RenderState {
  /** Traço das paredes (0 a 1). */
  draw: number;
  /** Preenchimento do poché. */
  poche: number;
  /** Portas e janelas. */
  details: number;
  /** Cotas, norte, escala e entrada. */
  annot: number;
  /** Rótulos dos ambientes. */
  labels: number;
  /** Rotação e inclinação até a axonometria. */
  turn: number;
  /** Extrusão das paredes. */
  lift: number;
  /** Opacidade geral dos pontos. */
  dots: number;
}

interface Colors {
  paper: string;
  graphite: string;
  concrete: string;
  signal: string;
  shade1: [number, number, number];
  shade2: [number, number, number];
}

const DIM = 120; // afastamento da cota, em cm
const SCALE = 100; // afastamento da escala gráfica, em cm

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readColors(el: Element): Colors {
  const cs = getComputedStyle(el);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    paper: v('--paper', '#f3f1ec'),
    graphite: v('--graphite', '#121211'),
    concrete: v('--concrete', '#6e6c66'),
    signal: v('--signal', '#ff4f00'),
    shade1: hexToRgb(v('--paper-shade-1', '#e6e3dc')),
    shade2: hexToRgb(v('--paper-shade-2', '#d9d6ce')),
  };
}

const MONO = '"Geist Mono", "Geist Mono Fallback", ui-monospace, monospace';

export class PlanRenderer {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private colors: Colors;
  private flat = { s: 1, ox: 0, oy: 0 };
  private axo = { s: 1, ox: 0, oy: 0 };
  /** Fator de tamanho do texto, conforme a escala do desenho. */
  private fs = 1;
  private hasLetterSpacing: boolean;
  cam: Camera;

  constructor(
    private canvas: HTMLCanvasElement,
    private plan: BuiltPlan,
    private text: PlanText,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.colors = readColors(canvas);
    this.hasLetterSpacing = 'letterSpacing' in this.ctx;
    this.cam = makeCamera(0, 0, 1, 0, 0, plan.center[0], plan.center[1]);
  }

  setPlan(plan: BuiltPlan) {
    this.plan = plan;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  /** Enquadra a planta plana e a axonometria final nas regiões dadas (px CSS). */
  fit(flatRegion: Region, axoRegion: Region) {
    const { bounds, def, center } = this.plan;
    const [bx0, by0, bx1, by1] = bounds;
    let U: [number, number, number, number];
    let P: [number, number, number, number];
    if (def.dimensionAxis === 'x') {
      U = [Math.min(bx0, def.entrance.label[0], def.north[0]), by0 - DIM, Math.max(bx1, def.north[0]), by1 + SCALE];
      P = [52, 20, 6, 28];
    } else {
      U = [bx0 - DIM, Math.min(by0, def.north[1], def.entrance.at[1]), bx1 + SCALE, by1];
      P = [20, 20, 34, 2];
    }
    const uw = U[2] - U[0];
    const uh = U[3] - U[1];
    const s0 = Math.max(0.05, Math.min((flatRegion.w - P[0] - P[2]) / uw, (flatRegion.h - P[1] - P[3]) / uh));
    // Centro do conteúdo (em px) alinhado ao centro da região, contando as margens de texto.
    const contentCx = flatRegion.x + P[0] + (flatRegion.w - P[0] - P[2]) / 2;
    const contentCy = flatRegion.y + P[1] + (flatRegion.h - P[1] - P[3]) / 2;
    this.flat = {
      s: s0,
      ox: contentCx - s0 * ((U[0] + U[2]) / 2 - center[0]),
      oy: contentCy - s0 * ((U[1] + U[3]) / 2 - center[1]),
    };
    this.fs = clamp(s0 / 0.4, 0.84, 1.4);

    // Axonometria final: caixa projetada do volume completo.
    const yaw = (def.camera.yaw * Math.PI) / 180;
    const pitch = (def.camera.pitch * Math.PI) / 180;
    const unit = makeCamera(yaw, pitch, 1, 0, 0, center[0], center[1]);
    const H = def.heights.wall;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of [
      [bx0, by0],
      [bx1, by0],
      [bx1, by1],
      [bx0, by1],
    ]) {
      for (const z of [0, H]) {
        const X = projectX(unit, x, y);
        const Y = projectY(unit, x, y, z);
        minX = Math.min(minX, X);
        maxX = Math.max(maxX, X);
        minY = Math.min(minY, Y);
        maxY = Math.max(maxY, Y);
      }
    }
    const s1 = Math.max(0.05, Math.min(axoRegion.w / (maxX - minX), axoRegion.h / (maxY - minY)));
    this.axo = {
      s: s1,
      ox: axoRegion.x + axoRegion.w / 2 - s1 * ((minX + maxX) / 2),
      oy: axoRegion.y + axoRegion.h / 2 - s1 * ((minY + maxY) / 2),
    };
  }

  private camera(turn: number): Camera {
    const def = this.plan.def;
    const k = clamp(turn);
    const yaw = ((def.camera.yaw * Math.PI) / 180) * k;
    const pitch = ((def.camera.pitch * Math.PI) / 180) * k;
    return makeCamera(
      yaw,
      pitch,
      lerp(this.flat.s, this.axo.s, k),
      lerp(this.flat.ox, this.axo.ox, k),
      lerp(this.flat.oy, this.axo.oy, k),
      this.plan.center[0],
      this.plan.center[1],
    );
  }

  /** Converte um ponto da tela para coordenadas da planta (piso), no estado atual. */
  toPlan(X: number, Y: number, turn: number): Vec2 {
    const c = this.camera(turn);
    const u = (X - c.ox) / c.s;
    const v = (Y - c.oy) / (c.s * (c.cosP || 1e-6));
    return [c.cosY * u + c.sinY * v + c.cx, -c.sinY * u + c.cosY * v + c.cy];
  }

  get bounds() {
    return this.plan.bounds;
  }

  /* Auxiliares de desenho */

  private widths = new Map<string, number>();

  /** Largura do texto na fonte atual, com cache (measureText custa caro a cada quadro). */
  private measure(text: string): number {
    const k = this.ctx.font + '|' + text;
    let w = this.widths.get(k);
    if (w === undefined) {
      w = this.ctx.measureText(text).width;
      this.widths.set(k, w);
    }
    return w;
  }

  private font(size: number, weight = 400) {
    this.ctx.font = `${weight} ${(size * this.fs).toFixed(2)}px ${MONO}`;
  }

  private spacing(em: number) {
    if (this.hasLetterSpacing) (this.ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${em}em`;
  }

  /** Coloca o contexto no referencial do piso, com origem no ponto dado e unidade em px. */
  private floorFrame(c: Camera, x: number, y: number, z = 0) {
    const d = this.dpr;
    const X = projectX(c, x, y);
    const Y = projectY(c, x, y, z);
    this.ctx.setTransform(d * c.cosY, d * c.sinY * c.cosP, d * -c.sinY, d * c.cosY * c.cosP, d * X, d * Y);
  }

  private screen() {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private moveTo(c: Camera, p: Vec2, z = 0) {
    this.ctx.moveTo(projectX(c, p[0], p[1]), projectY(c, p[0], p[1], z));
  }

  private lineTo(c: Camera, p: Vec2, z = 0) {
    this.ctx.lineTo(projectX(c, p[0], p[1]), projectY(c, p[0], p[1], z));
  }

  /** Traça uma polilinha até a fração `f` do comprimento. */
  private partial(c: Camera, pts: Vec2[], f: number, closed: boolean, z = 0) {
    const n = pts.length;
    const segs = closed ? n : n - 1;
    let total = 0;
    for (let i = 0; i < segs; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    let left = total * clamp(f);
    this.moveTo(c, pts[0], z);
    for (let i = 0; i < segs && left > 0; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len <= left) {
        this.lineTo(c, b, z);
        left -= len;
      } else {
        const t = left / len;
        this.lineTo(c, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], z);
        left = 0;
      }
    }
  }

  /* Desenho */

  /** Com a planta parada, desenha só os pontos numa camada própria (o resto não muda). */
  renderLeadsOnly(target: CanvasRenderingContext2D, state: RenderState, leads: Lead[], rings: Ring[]) {
    const main = this.ctx;
    this.ctx = target;
    this.screen();
    target.clearRect(0, 0, this.w, this.h);
    if (state.dots > 0.001) this.drawLeads(this.camera(state.turn), state.dots, leads, rings);
    this.ctx = main;
  }

  clear(target: CanvasRenderingContext2D) {
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.clearRect(0, 0, target.canvas.width, target.canvas.height);
  }

  render(state: RenderState, leads: Lead[] | null, rings: Ring[] = []) {
    const ctx = this.ctx;
    const { def, bounds } = this.plan;
    const col = this.colors;
    const c = this.camera(state.turn);
    this.cam = c;
    const [bx0, by0, bx1, by1] = bounds;
    const H = def.heights.wall * clamp(state.lift);
    const hs = def.heights.sill * clamp(state.lift);
    const extruding = H * c.s * c.sinP > 0.25;

    this.screen();
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'butt';

    // Piso: cobre a grelha do papel quando a planta sai do plano.
    const floorAlpha = smoothstep(0, 0.25, state.turn);
    if (floorAlpha > 0) {
      ctx.globalAlpha = floorAlpha;
      ctx.fillStyle = col.paper;
      ctx.beginPath();
      this.moveTo(c, [bx0, by0]);
      this.lineTo(c, [bx1, by0]);
      this.lineTo(c, [bx1, by1]);
      this.lineTo(c, [bx0, by1]);
      ctx.closePath();
      ctx.fill();
    }

    // Anotações da folha: somem quando a planta gira.
    const annotAlpha = state.annot * (1 - smoothstep(0, 0.16, state.turn));
    if (annotAlpha > 0.001) this.drawAnnotations(c, annotAlpha, state.annot);

    // Rótulos dos ambientes, deitados no piso.
    if (state.labels > 0.001) this.drawLabels(c, state.labels);

    // Portas no piso.
    if (state.details > 0.001) this.drawDoors(c, state.details);

    // Pontos (leads) e confirmações no Contrato.
    if (leads && state.dots > 0.001) this.drawLeads(c, state.dots, leads, rings);

    // Janelas: peitoris que sobem com a extrusão.
    if (state.details > 0.001) this.drawSills(c, state.details, hs, extruding);

    // Faces verticais das paredes, de trás para a frente.
    if (extruding) this.drawFaces(c, H, hs);

    // Topo das paredes: o poché.
    this.drawTops(c, state, H);

    ctx.globalAlpha = 1;
    this.screen();
  }

  private drawTops(c: Camera, state: RenderState, H: number) {
    const ctx = this.ctx;
    const { loops } = this.plan;
    this.screen();
    if (state.poche > 0.001) {
      ctx.globalAlpha = clamp(state.poche);
      ctx.fillStyle = this.colors.graphite;
      ctx.beginPath();
      for (const loop of loops) {
        this.moveTo(c, loop[0], H);
        for (let i = 1; i < loop.length; i++) this.lineTo(c, loop[i], H);
        ctx.closePath();
      }
      ctx.fill('evenodd');
    }
    if (state.draw > 0.001) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this.colors.graphite;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const loop of loops) this.partial(c, loop, state.draw, true, H);
      ctx.stroke();
    }
  }

  private drawFaces(c: Camera, H: number, hs: number) {
    const ctx = this.ctx;
    const vx = c.sinY;
    const vy = c.cosY;
    interface Item {
      f: Face;
      nv: number;
      lo: number;
      hi: number;
      ax: number;
      bx: number;
      ad: number;
      bd: number;
    }
    const items: Item[] = [];
    for (const f of this.plan.faces) {
      const nv = f.n[0] * vx + f.n[1] * vy;
      if (nv <= 1e-3) continue;
      const ax = rx(c, f.a[0], f.a[1]);
      const bx = rx(c, f.b[0], f.b[1]);
      items.push({ f, nv, lo: Math.min(ax, bx), hi: Math.max(ax, bx), ax, bx, ad: ry(c, f.a[0], f.a[1]), bd: ry(c, f.b[0], f.b[1]) });
    }
    const order = sortFaces(items);

    this.screen();
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.colors.graphite;
    const [r1, g1, b1] = this.colors.shade1;
    const [r2, g2, b2] = this.colors.shade2;
    for (const it of order) {
      const { f } = it;
      const z0 = f.zFromSill ? hs : 0;
      const t = clamp((it.nv - 0.35) / 0.55);
      ctx.fillStyle = `rgb(${Math.round(lerp(r2, r1, t))} ${Math.round(lerp(g2, g1, t))} ${Math.round(lerp(b2, b1, t))})`;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      this.moveTo(c, f.a, z0);
      this.lineTo(c, f.b, z0);
      this.lineTo(c, f.b, H);
      this.lineTo(c, f.a, H);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawSills(c: Camera, alpha: number, hs: number, extruding: boolean) {
    const ctx = this.ctx;
    const col = this.colors;
    const vx = c.sinY;
    const vy = c.cosY;
    this.screen();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = col.graphite;
    for (const s of this.plan.sills) {
      const [x0, y0, x1, y1] = s.rect;
      const corners: Vec2[] = [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
      ];
      if (extruding) {
        // Faces longas visíveis do peitoril.
        const sides: { a: Vec2; b: Vec2; n: Vec2 }[] = s.horizontal
          ? [
              { a: [x0, y0], b: [x1, y0], n: [0, -1] },
              { a: [x0, y1], b: [x1, y1], n: [0, 1] },
            ]
          : [
              { a: [x0, y0], b: [x0, y1], n: [-1, 0] },
              { a: [x1, y0], b: [x1, y1], n: [1, 0] },
            ];
        for (const side of sides) {
          const nv = side.n[0] * vx + side.n[1] * vy;
          if (nv <= 1e-3) continue;
          const t = clamp((nv - 0.35) / 0.55);
          const [r1, g1, b1] = col.shade1;
          const [r2, g2, b2] = col.shade2;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgb(${Math.round(lerp(r2, r1, t))} ${Math.round(lerp(g2, g1, t))} ${Math.round(lerp(b2, b1, t))})`;
          ctx.beginPath();
          this.moveTo(c, side.a, 0);
          this.lineTo(c, side.b, 0);
          this.lineTo(c, side.b, hs);
          this.lineTo(c, side.a, hs);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      // Tampo do peitoril (na planta: o símbolo da janela).
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col.paper;
      ctx.beginPath();
      corners.forEach((p, i) => (i === 0 ? this.moveTo(c, p, hs) : this.lineTo(c, p, hs)));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      this.partial(c, [corners[0], corners[1]], alpha, false, hs);
      this.partial(c, [corners[3], corners[2]], alpha, false, hs);
      ctx.stroke();
      // Vidro.
      ctx.beginPath();
      if (s.horizontal) {
        const cy = (y0 + y1) / 2;
        this.partial(c, [[x0, cy], [x1, cy]], alpha, false, hs);
      } else {
        const cx = (x0 + x1) / 2;
        this.partial(c, [[cx, y0], [cx, y1]], alpha, false, hs);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawDoors(c: Camera, f: number) {
    const ctx = this.ctx;
    this.screen();
    ctx.strokeStyle = this.colors.graphite;
    for (const d of this.plan.doors) {
      ctx.globalAlpha = clamp(f * 1.5);
      ctx.lineWidth = d.entrance ? 1.4 : 1.1;
      ctx.beginPath();
      this.partial(c, [d.hinge, d.leafEnd], clamp(f * 1.4), false);
      ctx.stroke();
      ctx.globalAlpha = 0.55 * clamp(f * 1.5);
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      this.partial(c, d.arc, clamp(f * 1.2 - 0.2), false);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawLabels(c: Camera, alpha: number) {
    const ctx = this.ctx;
    const col = this.colors;
    const rise = (1 - alpha) * 6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = alpha;
    // Agrupado por estilo: trocar a fonte do canvas custa caro.
    const rows: { size: number; weight: number; track: number; color: string; y: number; text: (k: RoomKey) => string }[] = [
      { size: 9.5, weight: 400, track: 0.06, color: col.concrete, y: -15, text: (k) => this.text.rooms[k].number },
      { size: 11.5, weight: 500, track: 0.09, color: col.graphite, y: 0, text: (k) => this.text.rooms[k].name.toLocaleUpperCase() },
      { size: 9.5, weight: 400, track: 0.02, color: col.concrete, y: 14.5, text: (k) => this.text.rooms[k].metric },
    ];
    // Cada rótulo cabe no seu ambiente: encolhe se o texto for mais largo que o cômodo.
    const fit = new Map<RoomKey, number>();
    for (const room of this.plan.rooms) fit.set(room.key, Infinity);
    for (const row of rows) {
      this.font(row.size, row.weight);
      this.spacing(row.track);
      for (const room of this.plan.rooms) {
        const avail = (room.rect[2] - room.rect[0] - 60) * c.s;
        fit.set(room.key, Math.min(fit.get(room.key)!, avail / (this.measure(row.text(room.key)) || 1)));
      }
    }
    for (const row of rows) {
      this.font(row.size, row.weight);
      this.spacing(row.track);
      ctx.fillStyle = row.color;
      for (const room of this.plan.rooms) {
        const k = Math.min(1, fit.get(room.key)!);
        this.floorFrame(c, room.label[0], room.label[1]);
        if (k < 1) ctx.scale(k, k);
        ctx.fillText(row.text(room.key), 0, row.y * this.fs + rise);
      }
    }
    // Circulação.
    const circ = this.plan.def.circulation;
    this.floorFrame(c, circ.label[0], circ.label[1]);
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = col.concrete;
    this.font(9);
    this.spacing(0.1);
    const label = this.text.circulation.toLocaleUpperCase();
    const parts = label.split('/').map((p) => p.trim());
    const lines = circ.vertical && parts.length > 1 ? [`${parts[0]} /`, parts.slice(1).join(' / ')] : [label];
    const widest = Math.max(...lines.map((l) => this.measure(l)));
    const k = Math.min(1, (circ.maxLength * c.s) / (widest || 1));
    if (circ.vertical) ctx.rotate(-Math.PI / 2);
    if (k < 1) ctx.scale(k, k);
    ctx.textAlign = circ.align === 'start' ? 'left' : 'center';
    lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * 12 * this.fs));
    this.spacing(0);
    ctx.globalAlpha = 1;
    this.screen();
  }

  private drawAnnotations(c: Camera, alpha: number, progress: number) {
    const ctx = this.ctx;
    const col = this.colors;
    const { def, bounds } = this.plan;
    const [bx0, by0, bx1, by1] = bounds;
    const grow = smoothstep(0, 1, progress);

    ctx.strokeStyle = col.graphite;
    ctx.fillStyle = col.graphite;

    // Cota geral.
    const tick = (p: Vec2) => {
      this.floorFrame(c, p[0], p[1]);
      ctx.beginPath();
      ctx.moveTo(-5, 5);
      ctx.lineTo(5, -5);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };
    this.screen();
    ctx.globalAlpha = alpha * 0.85;
    ctx.lineWidth = 0.7;
    if (def.dimensionAxis === 'x') {
      const y = by0 - DIM;
      const mid = (bx0 + bx1) / 2;
      const half = ((bx1 - bx0) / 2) * grow;
      ctx.beginPath();
      this.moveTo(c, [mid - half, y]);
      this.lineTo(c, [mid + half, y]);
      // Linhas de chamada.
      this.moveTo(c, [bx0, by0 - 28]);
      this.lineTo(c, [bx0, y - 22]);
      this.moveTo(c, [bx1, by0 - 28]);
      this.lineTo(c, [bx1, y - 22]);
      ctx.stroke();
      if (grow > 0.98) {
        tick([bx0, y]);
        tick([bx1, y]);
      }
      this.floorFrame(c, mid, y);
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      this.font(9.5, 500);
      this.spacing(0.1);
      ctx.fillText(this.text.dimension.toLocaleUpperCase(), 0, -6);
    } else {
      const x = bx0 - DIM;
      const mid = (by0 + by1) / 2;
      const half = ((by1 - by0) / 2) * grow;
      ctx.beginPath();
      this.moveTo(c, [x, mid - half]);
      this.lineTo(c, [x, mid + half]);
      this.moveTo(c, [bx0 - 28, by0]);
      this.lineTo(c, [x - 22, by0]);
      this.moveTo(c, [bx0 - 28, by1]);
      this.lineTo(c, [x - 22, by1]);
      ctx.stroke();
      if (grow > 0.98) {
        tick([x, by0]);
        tick([x, by1]);
      }
      this.floorFrame(c, x, mid);
      ctx.rotate(-Math.PI / 2);
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      this.font(9.5, 500);
      this.spacing(0.1);
      ctx.fillText(this.text.dimension.toLocaleUpperCase(), 0, -6);
    }

    // Escala gráfica em dias: 0, 15, 30, 45, 60, 75, 90.
    const steps = 6;
    this.screen();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.8;
    if (def.dimensionAxis === 'x') {
      const y = by1 + SCALE;
      const len = bx1 - bx0;
      for (let i = 0; i < steps; i++) {
        const a = bx0 + (len * i) / steps;
        const b = bx0 + (len * (i + 1)) / steps;
        this.floorFrame(c, a, y);
        const wpx = ((b - a) * c.s) * grow;
        ctx.beginPath();
        ctx.rect(0, -2.5, wpx, 5);
        if (i % 2 === 0) ctx.fill();
        ctx.stroke();
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      this.font(9);
      this.spacing(0.04);
      for (let i = 0; i <= steps; i++) {
        this.floorFrame(c, bx0 + (len * i) / steps, y);
        ctx.fillStyle = col.concrete;
        ctx.globalAlpha = alpha * smoothstep(i / steps - 0.15, i / steps, grow);
        ctx.fillText(String(i * 15), 0, 9);
      }
      this.floorFrame(c, bx0, y);
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      this.spacing(0.1);
      ctx.fillText(this.text.scaleUnit.toLocaleUpperCase(), -10, 0);
    } else {
      const x = bx1 + SCALE * 0.7;
      const len = by1 - by0;
      for (let i = 0; i < steps; i++) {
        const a = by0 + (len * i) / steps;
        const b = by0 + (len * (i + 1)) / steps;
        this.floorFrame(c, x, a);
        const hpx = ((b - a) * c.s) * grow;
        ctx.beginPath();
        ctx.rect(-2.5, 0, 5, hpx);
        if (i % 2 === 0) ctx.fill();
        ctx.stroke();
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      this.font(9);
      this.spacing(0.04);
      for (let i = 0; i <= steps; i++) {
        this.floorFrame(c, x, by0 + (len * i) / steps);
        ctx.fillStyle = col.concrete;
        ctx.globalAlpha = alpha * smoothstep(i / steps - 0.15, i / steps, grow);
        ctx.fillText(String(i * 15), 8, 0);
      }
      this.floorFrame(c, x, by1);
      ctx.globalAlpha = alpha;
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'left';
      this.spacing(0.1);
      ctx.fillText(this.text.scaleUnit.toLocaleUpperCase(), 14, 12);
    }

    // Norte.
    ctx.fillStyle = col.graphite;
    ctx.strokeStyle = col.graphite;
    this.floorFrame(c, def.north[0], def.north[1]);
    ctx.globalAlpha = alpha * grow;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-4.5, 9);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(4.5, 9);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    this.font(9.5, 500);
    this.spacing(0);
    ctx.fillText(this.text.north, 0, -16);

    // Entrada principal.
    const e = def.entrance;
    this.floorFrame(c, e.at[0], e.at[1]);
    ctx.rotate(Math.atan2(e.dir[1], e.dir[0]));
    ctx.globalAlpha = alpha * grow;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    this.floorFrame(c, e.label[0], e.label[1]);
    ctx.fillStyle = col.concrete;
    ctx.textAlign = def.dimensionAxis === 'x' ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    this.font(9);
    this.spacing(0.1);
    ctx.fillText(this.text.entrance.toLocaleUpperCase(), 0, 0);
    this.spacing(0);
    ctx.globalAlpha = 1;
    this.screen();
  }

  private drawLeads(c: Camera, alpha: number, leads: Lead[], rings: Ring[]) {
    const ctx = this.ctx;
    const col = this.colors;
    const r = 3.4 * clamp(c.s / 0.42, 0.85, 1.15);
    this.screen();
    ctx.fillStyle = col.signal;
    const entryX = this.plan.def.legs[0][0];
    const door = this.plan.def.legs[0][1];
    const entryLen = Math.hypot(door[0] - entryX[0], door[1] - entryX[1]) || 1;
    for (const l of leads) {
      let a = l.alpha * alpha;
      // Os pontos surgem ao se aproximar da porta principal.
      if (l.stage === 0 && l.phase === 'move') {
        const d = Math.hypot(l.x - entryX[0], l.y - entryX[1]);
        a *= smoothstep(0, 0.8, d / entryLen);
      }
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(projectX(c, l.x, l.y), projectY(c, l.x, l.y, 0), r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Confirmação de contrato: um anel no piso.
    ctx.strokeStyle = col.signal;
    for (const ring of rings) {
      const u = ring.age / LeadFlow.ringLife;
      const ease = 1 - Math.pow(1 - u, 3);
      this.floorFrame(c, ring.x, ring.y);
      ctx.globalAlpha = alpha * (1 - u);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 6 + ease * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    this.screen();
  }
}

/** Ordena faces verticais de trás para a frente (pintor), pela profundidade onde se sobrepõem. */
function sortFaces<T extends { lo: number; hi: number; ax: number; bx: number; ad: number; bd: number }>(items: T[]): T[] {
  const n = items.length;
  const depthAt = (it: T, x: number) => {
    const span = it.bx - it.ax;
    if (Math.abs(span) < 1e-6) return (it.ad + it.bd) / 2;
    const t = (x - it.ax) / span;
    return it.ad + (it.bd - it.ad) * t;
  };
  const after: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const lo = Math.max(items[i].lo, items[j].lo);
      const hi = Math.min(items[i].hi, items[j].hi);
      if (hi - lo < 0.5) continue;
      const mid = (lo + hi) / 2;
      const di = depthAt(items[i], mid);
      const dj = depthAt(items[j], mid);
      if (Math.abs(di - dj) < 1e-6) continue;
      // Quem está mais longe (menor profundidade) vai primeiro.
      if (di < dj) {
        after[i].push(j);
        indeg[j]++;
      } else {
        after[j].push(i);
        indeg[i]++;
      }
    }
  }
  const depthMid = (it: T) => (it.ad + it.bd) / 2;
  const ready = items.map((_, i) => i).filter((i) => indeg[i] === 0);
  const out: T[] = [];
  const done = new Uint8Array(n);
  while (out.length < n) {
    if (!ready.length) {
      // Ciclo (não deveria ocorrer): segue pela profundidade média.
      let best = -1;
      for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || depthMid(items[i]) < depthMid(items[best]))) best = i;
      ready.push(best);
      indeg[best] = 0;
    }
    ready.sort((a, b) => depthMid(items[b]) - depthMid(items[a]));
    const i = ready.pop()!;
    if (done[i]) continue;
    done[i] = 1;
    out.push(items[i]);
    for (const j of after[i]) if (--indeg[j] === 0 && !done[j]) ready.push(j);
  }
  return out;
}
