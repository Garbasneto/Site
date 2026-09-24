/*
  A planta do hero, definida como dados.
  Unidade: centímetro. Eixo y para baixo. Paredes pelo eixo (linha de centro).
  O desenho plano, a axonometria e o trajeto dos pontos saem destes números.

  landscape: desktop e tablets deitados (18 x 10 m).
  portrait: celular (10 x 14 m), corredor em pé.
*/

import type { PlanDef } from '../lib/plan/types';

const EXT = 30;
const INT = 15;

export const landscape: PlanDef = {
  id: 'landscape',
  walls: [
    { from: [0, 0], to: [1800, 0], t: EXT, exterior: true }, // 0 fachada norte
    { from: [1800, 0], to: [1800, 1160], t: EXT, exterior: true }, // 1 fachada leste
    { from: [0, 1160], to: [1800, 1160], t: EXT, exterior: true }, // 2 fachada sul
    { from: [0, 0], to: [0, 1160], t: EXT, exterior: true }, // 3 fachada oeste
    { from: [0, 490], to: [1440, 490], t: INT }, // 4 corredor, lado norte
    { from: [0, 630], to: [1440, 630], t: INT }, // 5 corredor, lado sul
    { from: [1440, 0], to: [1440, 1160], t: INT }, // 6 divisa do contrato
    { from: [520, 0], to: [520, 490], t: INT }, // 7 atração | whatsapp
    { from: [960, 0], to: [960, 490], t: INT }, // 8 whatsapp | proposta
    { from: [640, 630], to: [640, 1160], t: INT }, // 9 formulário | diagnóstico
  ],
  openings: [
    { wall: 3, at: 240, width: 110, kind: 'entrance', hinge: 'min', swing: 1 },
    { wall: 4, at: 400, width: 85, kind: 'door', hinge: 'max', swing: -1 },
    { wall: 5, at: 460, width: 85, kind: 'door', hinge: 'min', swing: 1 },
    { wall: 4, at: 760, width: 85, kind: 'door', hinge: 'min', swing: -1 },
    { wall: 5, at: 880, width: 85, kind: 'door', hinge: 'max', swing: 1 },
    { wall: 4, at: 1220, width: 85, kind: 'door', hinge: 'max', swing: -1 },
    { wall: 6, at: 560, width: 90, kind: 'door', hinge: 'min', swing: 1 },
    { wall: 0, at: 270, width: 200, kind: 'window' },
    { wall: 0, at: 740, width: 180, kind: 'window' },
    { wall: 0, at: 1200, width: 220, kind: 'window' },
    { wall: 0, at: 1620, width: 180, kind: 'window' },
    { wall: 2, at: 320, width: 240, kind: 'window' },
    { wall: 2, at: 1040, width: 320, kind: 'window' },
    { wall: 2, at: 1620, width: 180, kind: 'window' },
    { wall: 1, at: 300, width: 240, kind: 'window' },
    { wall: 1, at: 860, width: 240, kind: 'window' },
    { wall: 3, at: 900, width: 220, kind: 'window' },
  ],
  rooms: [
    { key: 'atracao', rect: [0, 0, 520, 490], label: [300, 165], stop: [230, 355], spread: 60 },
    { key: 'formulario', rect: [0, 630, 640, 1160], label: [270, 790], stop: [430, 1000], spread: 70 },
    { key: 'whatsapp', rect: [520, 0, 960, 490], label: [740, 165], stop: [740, 355], spread: 60 },
    { key: 'diagnostico', rect: [640, 630, 1440, 1160], label: [1130, 790], stop: [900, 1000], spread: 80 },
    { key: 'proposta', rect: [960, 0, 1440, 490], label: [1200, 165], stop: [1200, 355], spread: 60 },
    { key: 'contrato', rect: [1440, 0, 1800, 1160], label: [1620, 330], stop: [1620, 740], spread: 70 },
  ],
  circulation: { rect: [0, 490, 1440, 630], label: [40, 560], align: 'start', maxLength: 330, vertical: false },
  legs: [
    [[-340, 240], [-60, 240], [60, 242], [230, 355]],
    [[230, 355], [400, 420], [400, 490], [400, 570], [460, 570], [460, 630], [460, 720], [430, 1000]],
    [[430, 1000], [460, 700], [460, 630], [460, 570], [760, 570], [760, 490], [760, 420], [740, 355]],
    [[740, 355], [760, 420], [760, 490], [760, 570], [880, 570], [880, 630], [880, 720], [900, 1000]],
    [[900, 1000], [880, 700], [880, 630], [880, 570], [1220, 570], [1220, 490], [1220, 420], [1200, 355]],
    [[1200, 355], [1220, 420], [1220, 490], [1220, 570], [1380, 562], [1440, 560], [1510, 565], [1620, 740]],
  ],
  entrance: { at: [-48, 240], dir: [1, 0], label: [-36, 180] },
  dimensionAxis: 'x',
  north: [-120, -120],
  heights: { wall: 200, sill: 80 },
  camera: { yaw: 30, pitch: 54 },
  pass: [0.62, 0.72, 0.66, 0.7, 0.55],
  spawn: [0.8, 2.1],
  speed: 170,
};

export const portrait: PlanDef = {
  id: 'portrait',
  walls: [
    { from: [0, 0], to: [1000, 0], t: EXT, exterior: true }, // 0
    { from: [1000, 0], to: [1000, 1400], t: EXT, exterior: true }, // 1
    { from: [0, 1400], to: [1000, 1400], t: EXT, exterior: true }, // 2
    { from: [0, 0], to: [0, 1400], t: EXT, exterior: true }, // 3
    { from: [430, 0], to: [430, 1000], t: INT }, // 4 corredor, lado oeste
    { from: [570, 0], to: [570, 1000], t: INT }, // 5 corredor, lado leste
    { from: [0, 1000], to: [1000, 1000], t: INT }, // 6 divisa do contrato
    { from: [0, 420], to: [430, 420], t: INT }, // 7 atração | whatsapp
    { from: [0, 720], to: [430, 720], t: INT }, // 8 whatsapp | proposta
    { from: [570, 460], to: [1000, 460], t: INT }, // 9 formulário | diagnóstico
  ],
  openings: [
    { wall: 0, at: 150, width: 110, kind: 'entrance', hinge: 'max', swing: 1 },
    { wall: 4, at: 370, width: 85, kind: 'door', hinge: 'min', swing: -1 },
    { wall: 5, at: 400, width: 85, kind: 'door', hinge: 'min', swing: 1 },
    { wall: 4, at: 620, width: 85, kind: 'door', hinge: 'max', swing: -1 },
    { wall: 5, at: 650, width: 85, kind: 'door', hinge: 'min', swing: 1 },
    { wall: 4, at: 900, width: 85, kind: 'door', hinge: 'max', swing: -1 },
    { wall: 6, at: 500, width: 90, kind: 'door', hinge: 'min', swing: 1 },
    { wall: 0, at: 785, width: 180, kind: 'window' },
    { wall: 3, at: 250, width: 170, kind: 'window' },
    { wall: 3, at: 570, width: 160, kind: 'window' },
    { wall: 3, at: 860, width: 160, kind: 'window' },
    { wall: 3, at: 1200, width: 200, kind: 'window' },
    { wall: 1, at: 230, width: 180, kind: 'window' },
    { wall: 1, at: 730, width: 240, kind: 'window' },
    { wall: 1, at: 1200, width: 200, kind: 'window' },
    { wall: 2, at: 500, width: 320, kind: 'window' },
  ],
  rooms: [
    { key: 'atracao', rect: [0, 0, 430, 420], label: [255, 195], stop: [210, 330], spread: 45 },
    { key: 'formulario', rect: [570, 0, 1000, 460], label: [785, 130], stop: [760, 320], spread: 55 },
    { key: 'whatsapp', rect: [0, 420, 430, 720], label: [200, 510], stop: [270, 640], spread: 45 },
    { key: 'diagnostico', rect: [570, 460, 1000, 1000], label: [800, 790], stop: [720, 615], spread: 50 },
    { key: 'proposta', rect: [0, 720, 430, 1000], label: [200, 800], stop: [270, 920], spread: 40 },
    { key: 'contrato', rect: [0, 1000, 1000, 1400], label: [500, 1215], stop: [500, 1100], spread: 60 },
  ],
  circulation: { rect: [430, 0, 570, 1000], label: [500, 172], align: 'center', maxLength: 300, vertical: true },
  legs: [
    [[150, -320], [150, -60], [152, 60], [210, 330]],
    [[210, 330], [360, 370], [430, 370], [500, 385], [570, 400], [640, 400], [760, 320]],
    [[760, 320], [640, 400], [570, 400], [500, 450], [500, 610], [430, 620], [360, 625], [270, 640]],
    [[270, 640], [360, 625], [430, 620], [500, 632], [570, 650], [640, 648], [720, 615]],
    [[720, 615], [640, 648], [570, 650], [500, 700], [500, 890], [430, 900], [360, 905], [270, 920]],
    [[270, 920], [360, 905], [430, 900], [500, 930], [500, 1000], [500, 1050], [500, 1100]],
  ],
  entrance: { at: [150, -46], dir: [0, 1], label: [186, -46] },
  dimensionAxis: 'y',
  north: [1085, -95],
  heights: { wall: 95, sill: 38 },
  camera: { yaw: 22, pitch: 56 },
  pass: [0.62, 0.72, 0.66, 0.7, 0.55],
  spawn: [1.3, 3.0],
  speed: 135,
};
