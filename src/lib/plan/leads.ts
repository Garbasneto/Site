/*
  Os leads: pontos na cor sinal que entram pela porta principal, percorrem a circulação
  e passam pelos ambientes. Parte para em cada etapa e esmaece; poucos chegam ao Contrato.
*/

import { offsetInterior, pointAt, smooth, toPath, type BuiltPlan, type Path } from './geometry';
import type { Vec2 } from './types';

type Phase = 'move' | 'dwell' | 'fade' | 'hold';

export interface Lead {
  stage: number;
  phase: Phase;
  path: Path | null;
  t: number;
  dur: number;
  x: number;
  y: number;
  alpha: number;
  lat: number;
  speed: number;
}

export interface Ring {
  x: number;
  y: number;
  age: number;
}

const RING_LIFE = 1.6;
const MAX_LEADS = 36;

const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

function rand(a: number, b: number, rng: () => number): number {
  return a + (b - a) * rng();
}

/** Gerador determinístico para o layout estático (movimento reduzido). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class LeadFlow {
  leads: Lead[] = [];
  rings: Ring[] = [];
  private clock = 0;
  private nextSpawn = 0;
  private spawned = 0;
  private rng: () => number;

  constructor(
    private plan: BuiltPlan,
    rng: () => number = Math.random,
  ) {
    this.rng = rng;
  }

  private stopPoint(stage: number): Vec2 {
    const room = this.plan.rooms.find((r) => r.key === ['atracao', 'formulario', 'whatsapp', 'diagnostico', 'proposta', 'contrato'][stage])!;
    const a = this.rng() * Math.PI * 2;
    const r = Math.sqrt(this.rng()) * room.spread;
    return [room.stop[0] + Math.cos(a) * r, room.stop[1] + Math.sin(a) * r * 0.8];
  }

  private startLeg(lead: Lead, stage: number) {
    const base = this.plan.def.legs[stage];
    const pts = base.map((p) => [p[0], p[1]] as Vec2);
    if (stage > 0) pts[0] = [lead.x, lead.y];
    pts[pts.length - 1] = this.stopPoint(stage);
    const path = toPath(smooth(offsetInterior(pts, lead.lat), 2));
    lead.stage = stage;
    lead.phase = 'move';
    lead.path = path;
    lead.t = 0;
    lead.dur = path.length / lead.speed;
  }

  private spawn() {
    if (this.leads.length >= MAX_LEADS) return;
    const first = this.plan.def.legs[0][0];
    const lead: Lead = {
      stage: 0,
      phase: 'move',
      path: null,
      t: 0,
      dur: 1,
      x: first[0],
      y: first[1],
      alpha: 1,
      lat: rand(-12, 12, this.rng),
      speed: this.plan.def.speed * rand(0.85, 1.15, this.rng),
    };
    this.startLeg(lead, 0);
    this.leads.push(lead);
    this.spawned++;
  }

  update(dt: number) {
    const def = this.plan.def;
    this.clock += dt;
    if (this.clock >= this.nextSpawn) {
      this.spawn();
      // As primeiras entradas vêm mais próximas, para a planta ganhar vida logo.
      const [a, b] = this.spawned < 4 ? [0.45, 0.9] : def.spawn;
      this.nextSpawn = this.clock + rand(a, b, this.rng);
    }

    for (const lead of this.leads) {
      lead.t += dt;
      switch (lead.phase) {
        case 'move': {
          const u = Math.min(1, lead.t / lead.dur);
          const p = pointAt(lead.path!, lead.path!.length * easeInOut(u));
          lead.x = p[0];
          lead.y = p[1];
          if (u >= 1) {
            lead.phase = 'dwell';
            lead.t = 0;
            lead.dur = lead.stage === 5 ? 0 : rand(0.3, 1.0, this.rng);
          }
          break;
        }
        case 'dwell': {
          if (lead.t < lead.dur) break;
          if (lead.stage === 5) {
            this.rings.push({ x: lead.x, y: lead.y, age: 0 });
            lead.phase = 'hold';
            lead.t = 0;
            lead.dur = 2.6;
          } else if (this.rng() < def.pass[lead.stage]) {
            this.startLeg(lead, lead.stage + 1);
          } else {
            lead.phase = 'hold';
            lead.t = 0;
            lead.dur = 0.5;
          }
          break;
        }
        case 'hold': {
          if (lead.t >= lead.dur) {
            lead.phase = 'fade';
            lead.t = 0;
            lead.dur = lead.stage === 5 ? 1.4 : 1.8;
          }
          break;
        }
        case 'fade': {
          lead.alpha = Math.max(0, 1 - lead.t / lead.dur) * (lead.stage === 5 ? 1 : 0.85);
          break;
        }
      }
    }
    this.leads = this.leads.filter((l) => !(l.phase === 'fade' && l.alpha <= 0));

    for (const r of this.rings) r.age += dt;
    this.rings = this.rings.filter((r) => r.age < RING_LIFE);
  }

  /** Avança a simulação sem desenhar, para o loop começar já com vida. */
  warmup(seconds: number) {
    const step = 1 / 30;
    for (let t = 0; t < seconds; t += step) this.update(step);
  }

  static ringLife = RING_LIFE;

  /** Pontos parados para o movimento reduzido: a queda do funil, sem animação. */
  static staticLayout(plan: BuiltPlan): Lead[] {
    const rng = mulberry32(90);
    const counts = [7, 5, 4, 3, 2, 1];
    const keys = ['atracao', 'formulario', 'whatsapp', 'diagnostico', 'proposta', 'contrato'];
    const out: Lead[] = [];
    counts.forEach((n, stage) => {
      const room = plan.rooms.find((r) => r.key === keys[stage])!;
      for (let i = 0; i < n; i++) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * room.spread;
        out.push({
          stage,
          phase: 'hold',
          path: null,
          t: 0,
          dur: 0,
          x: room.stop[0] + Math.cos(a) * r,
          y: room.stop[1] + Math.sin(a) * r * 0.8,
          alpha: stage === 5 ? 1 : 0.85,
          lat: 0,
          speed: 0,
        });
      }
    });
    return out;
  }
}
