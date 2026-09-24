/*
  Constrói a geometria desenhável a partir dos dados da planta:
  caixas de parede sem sobreposição, contorno unido do poché (sem emendas nas junções),
  faces verticais para a extrusão, peitoris das janelas, portas e trajetos.
*/

import type { PlanDef, RoomDef, Vec2 } from './types';

export type Rect = [number, number, number, number]; // x0, y0, x1, y1

export interface Face {
  a: Vec2;
  b: Vec2;
  /** Normal para fora, unitária e ortogonal. */
  n: Vec2;
  /** Altura de partida: 0, ou a altura do peitoril quando a face encosta numa janela. */
  zFromSill: boolean;
}

export interface Door {
  hinge: Vec2;
  leafEnd: Vec2;
  /** Pontos do arco de abertura, da folha aberta até o batente oposto. */
  arc: Vec2[];
  entrance: boolean;
}

export interface Sill {
  rect: Rect;
  horizontal: boolean;
}

export interface BuiltPlan {
  def: PlanDef;
  /** Faces externas do edifício. */
  bounds: Rect;
  center: Vec2;
  loops: Vec2[][];
  loopLengths: number[];
  faces: Face[];
  sills: Sill[];
  doors: Door[];
  rooms: RoomDef[];
}

const EPS = 0.01;

interface Box {
  r: Rect;
  horizontal: boolean;
  exterior: boolean;
}

function rank(b: Box): number {
  return (b.exterior ? 0 : 2) + (b.horizontal ? 0 : 1);
}

function overlaps(a: Rect, b: Rect): boolean {
  return a[0] < b[2] - EPS && b[0] < a[2] - EPS && a[1] < b[3] - EPS && b[1] < a[3] - EPS;
}

/** Remove o intervalo [lo, hi] do eixo longo da caixa. */
function cut(box: Box, lo: number, hi: number): Box[] {
  const [x0, y0, x1, y1] = box.r;
  const out: Box[] = [];
  if (box.horizontal) {
    if (lo - x0 > 0.5) out.push({ ...box, r: [x0, y0, Math.min(lo, x1), y1] });
    if (x1 - hi > 0.5) out.push({ ...box, r: [Math.max(hi, x0), y0, x1, y1] });
  } else {
    if (lo - y0 > 0.5) out.push({ ...box, r: [x0, y0, x1, Math.min(lo, y1)] });
    if (y1 - hi > 0.5) out.push({ ...box, r: [x0, Math.max(hi, y0), x1, y1] });
  }
  return out;
}

function key(x: number, y: number): string {
  return `${Math.round(x * 100)}:${Math.round(y * 100)}`;
}

/** Contorno da união de retângulos ortogonais, por compressão de coordenadas. */
function unionLoops(rects: Rect[]): { loops: Vec2[][]; normals: Vec2[][] } {
  const xs = [...new Set(rects.flatMap((r) => [r[0], r[2]]))].sort((a, b) => a - b);
  const ys = [...new Set(rects.flatMap((r) => [r[1], r[3]]))].sort((a, b) => a - b);
  const nx = xs.length - 1;
  const ny = ys.length - 1;
  const filled = new Uint8Array(nx * ny);
  for (let i = 0; i < nx; i++) {
    const cx = (xs[i] + xs[i + 1]) / 2;
    for (let j = 0; j < ny; j++) {
      const cy = (ys[j] + ys[j + 1]) / 2;
      for (const r of rects) {
        if (cx > r[0] && cx < r[2] && cy > r[1] && cy < r[3]) {
          filled[i * ny + j] = 1;
          break;
        }
      }
    }
  }
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= nx || j >= ny ? 0 : filled[i * ny + j]);

  interface Edge {
    a: Vec2;
    b: Vec2;
    n: Vec2;
    used: boolean;
  }
  const edges: Edge[] = [];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      if (!at(i, j)) continue;
      const X0 = xs[i];
      const X1 = xs[i + 1];
      const Y0 = ys[j];
      const Y1 = ys[j + 1];
      // Sentido de percurso com a normal externa à direita (eixo y para baixo).
      if (!at(i, j - 1)) edges.push({ a: [X1, Y0], b: [X0, Y0], n: [0, -1], used: false });
      if (!at(i, j + 1)) edges.push({ a: [X0, Y1], b: [X1, Y1], n: [0, 1], used: false });
      if (!at(i - 1, j)) edges.push({ a: [X0, Y0], b: [X0, Y1], n: [-1, 0], used: false });
      if (!at(i + 1, j)) edges.push({ a: [X1, Y1], b: [X1, Y0], n: [1, 0], used: false });
    }
  }

  const byStart = new Map<string, Edge[]>();
  for (const e of edges) {
    const k = key(e.a[0], e.a[1]);
    const list = byStart.get(k);
    if (list) list.push(e);
    else byStart.set(k, [e]);
  }

  const loops: Vec2[][] = [];
  const normals: Vec2[][] = [];
  for (const start of edges) {
    if (start.used) continue;
    const chain: Edge[] = [];
    let e: Edge | undefined = start;
    while (e && !e.used) {
      e.used = true;
      chain.push(e);
      const next: Edge[] = byStart.get(key(e.b[0], e.b[1])) ?? [];
      e = next.find((c) => !c.used);
    }
    // Junta arestas colineares consecutivas.
    const pts: Vec2[] = [];
    const ns: Vec2[] = [];
    for (let i = 0; i < chain.length; i++) {
      const c = chain[i];
      const prev = chain[(i - 1 + chain.length) % chain.length];
      if (i === 0 || prev.n[0] !== c.n[0] || prev.n[1] !== c.n[1]) {
        pts.push(c.a);
        ns.push(c.n);
      }
    }
    // Se a primeira e a última aresta forem colineares, a primeira já foi aberta no ponto certo
    // apenas quando a anterior difere; trata o caso de volta completa.
    if (chain.length > 1) {
      const first = chain[0];
      const last = chain[chain.length - 1];
      if (first.n[0] === last.n[0] && first.n[1] === last.n[1] && pts.length > 1) {
        pts.shift();
        ns.shift();
      }
    }
    if (pts.length >= 3) {
      loops.push(pts);
      normals.push(ns);
    }
  }
  return { loops, normals };
}

function doorGeometry(axisHorizontal: boolean, wallCoord: number, t: number, lo: number, hi: number, hinge: 'min' | 'max', swing: 1 | -1, entrance: boolean): Door {
  const w = hi - lo;
  const hingeAlong = hinge === 'min' ? lo : hi;
  const closedDir = hinge === 'min' ? 1 : -1;
  const face = wallCoord + (swing * t) / 2;
  const P = (along: number, across: number): Vec2 => (axisHorizontal ? [along, across] : [across, along]);
  const hingePt = P(hingeAlong, face);
  const leafEnd = P(hingeAlong, face + swing * w);
  const arc: Vec2[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    const along = hingeAlong + closedDir * w * Math.sin(a);
    const across = face + swing * w * Math.cos(a);
    arc.push(P(along, across));
  }
  return { hinge: hingePt, leafEnd, arc, entrance };
}

export function buildPlan(def: PlanDef): BuiltPlan {
  // 1. Caixas brutas, com os vãos recortados.
  let boxes: Box[] = [];
  const sills: Sill[] = [];
  const doors: Door[] = [];

  def.walls.forEach((w, index) => {
    const horizontal = Math.abs(w.from[1] - w.to[1]) < EPS;
    const h = w.t / 2;
    const r: Rect = horizontal
      ? [Math.min(w.from[0], w.to[0]) - h, w.from[1] - h, Math.max(w.from[0], w.to[0]) + h, w.from[1] + h]
      : [w.from[0] - h, Math.min(w.from[1], w.to[1]) - h, w.from[0] + h, Math.max(w.from[1], w.to[1]) + h];
    let parts: Box[] = [{ r, horizontal, exterior: !!w.exterior }];
    for (const o of def.openings) {
      if (o.wall !== index) continue;
      const lo = o.at - o.width / 2;
      const hi = o.at + o.width / 2;
      parts = parts.flatMap((p) => cut(p, lo, hi));
      if (o.kind === 'window') {
        sills.push({
          rect: horizontal ? [lo, r[1], hi, r[3]] : [r[0], lo, r[2], hi],
          horizontal,
        });
      } else {
        const wallCoord = horizontal ? w.from[1] : w.from[0];
        doors.push(doorGeometry(horizontal, wallCoord, w.t, lo, hi, o.hinge ?? 'min', o.swing ?? 1, o.kind === 'entrance'));
      }
    }
    boxes.push(...parts);
  });

  // 2. Resolve sobreposições nas junções: fachada vence divisória, horizontal vence vertical.
  const ordered = [...boxes].sort((a, b) => rank(a) - rank(b));
  const resolved: Box[] = [];
  for (const b of ordered) {
    let pieces: Box[] = [b];
    for (const a of resolved) {
      if (rank(a) >= rank(b)) continue;
      pieces = pieces.flatMap((p) => {
        if (!overlaps(a.r, p.r)) return [p];
        return p.horizontal ? cut(p, a.r[0], a.r[2]) : cut(p, a.r[1], a.r[3]);
      });
    }
    resolved.push(...pieces);
  }
  boxes = resolved;

  // 3. Contorno unido e faces.
  const { loops, normals } = unionLoops(boxes.map((b) => b.r));
  const faces: Face[] = [];
  const touchesSill = (a: Vec2, b: Vec2): boolean =>
    sills.some((s) => {
      const [x0, y0, x1, y1] = s.rect;
      if (Math.abs(a[0] - b[0]) < EPS) {
        // face vertical em planta (x constante): encosta na cabeceira de um peitoril horizontal
        const x = a[0];
        const ya = Math.min(a[1], b[1]);
        const yb = Math.max(a[1], b[1]);
        return (Math.abs(x - x0) < EPS || Math.abs(x - x1) < EPS) && ya >= y0 - EPS && yb <= y1 + EPS;
      }
      const y = a[1];
      const xa = Math.min(a[0], b[0]);
      const xb = Math.max(a[0], b[0]);
      return (Math.abs(y - y0) < EPS || Math.abs(y - y1) < EPS) && xa >= x0 - EPS && xb <= x1 + EPS;
    });

  const loopLengths = loops.map((loop, li) => {
    let len = 0;
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      len += Math.hypot(b[0] - a[0], b[1] - a[1]);
      faces.push({ a, b, n: normals[li][i], zFromSill: touchesSill(a, b) });
    }
    return len;
  });

  // 4. Limites externos.
  let bx0 = Infinity;
  let by0 = Infinity;
  let bx1 = -Infinity;
  let by1 = -Infinity;
  for (const b of boxes) {
    bx0 = Math.min(bx0, b.r[0]);
    by0 = Math.min(by0, b.r[1]);
    bx1 = Math.max(bx1, b.r[2]);
    by1 = Math.max(by1, b.r[3]);
  }

  return {
    def,
    bounds: [bx0, by0, bx1, by1],
    center: [(bx0 + bx1) / 2, (by0 + by1) / 2],
    loops,
    loopLengths,
    faces,
    sills,
    doors,
    rooms: def.rooms,
  };
}

/* Trajetos dos pontos */

/** Suaviza uma polilinha (Chaikin), mantendo as pontas. */
export function smooth(points: Vec2[], iterations = 2): Vec2[] {
  let pts = points;
  for (let k = 0; k < iterations; k++) {
    const out: Vec2[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

export interface Path {
  pts: Vec2[];
  cum: number[];
  length: number;
}

export function toPath(pts: Vec2[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, cum, length: cum[cum.length - 1] };
}

export function pointAt(path: Path, s: number): Vec2 {
  const { pts, cum } = path;
  if (s <= 0) return pts[0];
  if (s >= path.length) return pts[pts.length - 1];
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < s) lo = mid;
    else hi = mid;
  }
  const f = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f];
}

/** Desloca os pontos internos de uma polilinha na direção da normal local. */
export function offsetInterior(points: Vec2[], d: number): Vec2[] {
  return points.map((p, i) => {
    if (i === 0 || i === points.length - 1) return p;
    const a = points[i - 1];
    const b = points[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / len) * d, p[1] + (dx / len) * d] as Vec2;
  });
}
