/*
  Projeção axonométrica calculada à mão: rotação em torno do eixo vertical (yaw),
  inclinação (pitch) e projeção ortográfica. Com yaw = pitch = 0, é a planta baixa.
*/

export interface Camera {
  s: number;
  ox: number;
  oy: number;
  cx: number;
  cy: number;
  cosY: number;
  sinY: number;
  cosP: number;
  sinP: number;
}

export function makeCamera(yawRad: number, pitchRad: number, s: number, ox: number, oy: number, cx: number, cy: number): Camera {
  return {
    s,
    ox,
    oy,
    cx,
    cy,
    cosY: Math.cos(yawRad),
    sinY: Math.sin(yawRad),
    cosP: Math.cos(pitchRad),
    sinP: Math.sin(pitchRad),
  };
}

/** Coordenada horizontal girada (sem escala). */
export function rx(c: Camera, x: number, y: number): number {
  return c.cosY * (x - c.cx) - c.sinY * (y - c.cy);
}

/** Profundidade: quanto maior, mais perto do observador. */
export function ry(c: Camera, x: number, y: number): number {
  return c.sinY * (x - c.cx) + c.cosY * (y - c.cy);
}

export function projectX(c: Camera, x: number, y: number): number {
  return c.ox + c.s * rx(c, x, y);
}

export function projectY(c: Camera, x: number, y: number, z: number): number {
  return c.oy + c.s * (ry(c, x, y) * c.cosP - z * c.sinP);
}

/** Matriz afim do plano z (piso ou topo das paredes) para ctx.setTransform, em px CSS. */
export function planeMatrix(c: Camera, z: number): [number, number, number, number, number, number] {
  const a = c.s * c.cosY;
  const b = c.s * c.sinY * c.cosP;
  const cc = -c.s * c.sinY;
  const d = c.s * c.cosY * c.cosP;
  const e = c.ox - a * c.cx - cc * c.cy;
  const f = c.oy - b * c.cx - d * c.cy - c.s * z * c.sinP;
  return [a, b, cc, d, e, f];
}

/** Do ponto na tela para o piso (z = 0). */
export function unprojectFloor(c: Camera, X: number, Y: number): [number, number] {
  const u = (X - c.ox) / c.s;
  const v = (Y - c.oy) / (c.s * (c.cosP || 1e-6));
  // u = cos*dx - sin*dy ; v = sin*dx + cos*dy
  const dx = c.cosY * u + c.sinY * v;
  const dy = -c.sinY * u + c.cosY * v;
  return [dx + c.cx, dy + c.cy];
}
