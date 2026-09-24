/*
  Formato da planta. Unidade: centímetro. Eixo y cresce para baixo, como no papel.
  Paredes são sempre ortogonais (horizontais ou verticais).
*/

export type Vec2 = readonly [number, number];

export type RoomKey = 'atracao' | 'formulario' | 'whatsapp' | 'diagnostico' | 'proposta' | 'contrato';

export const stageOrder: readonly RoomKey[] = [
  'atracao',
  'formulario',
  'whatsapp',
  'diagnostico',
  'proposta',
  'contrato',
];

export interface WallDef {
  /** Linha de eixo da parede. */
  from: Vec2;
  to: Vec2;
  /** Espessura. */
  t: number;
  exterior?: boolean;
}

export interface OpeningDef {
  /** Índice da parede em `walls`. */
  wall: number;
  /** Centro do vão, na coordenada do eixo da parede (x para paredes horizontais, y para verticais). */
  at: number;
  width: number;
  kind: 'door' | 'entrance' | 'window';
  /** Portas: lado da dobradiça ('min' ou 'max' ao longo da parede). */
  hinge?: 'min' | 'max';
  /** Portas: lado para onde a folha abre (+1 = +y ou +x, -1 = -y ou -x). */
  swing?: 1 | -1;
}

export interface RoomDef {
  key: RoomKey;
  /** Retângulo em coordenadas de eixo: [x0, y0, x1, y1]. */
  rect: readonly [number, number, number, number];
  /** Centro do rótulo. */
  label: Vec2;
  /** Onde os pontos param nesta etapa. */
  stop: Vec2;
  /** Raio da dispersão dos pontos parados. */
  spread: number;
}

export interface PlanDef {
  id: 'landscape' | 'portrait';
  walls: WallDef[];
  openings: OpeningDef[];
  rooms: RoomDef[];
  circulation: {
    rect: readonly [number, number, number, number];
    /** Âncora do rótulo: início do texto ('start') ou centro ('center'). */
    label: Vec2;
    align: 'start' | 'center';
    /** Comprimento máximo do rótulo, em cm (o texto encolhe se precisar). */
    maxLength: number;
    /** Rótulo na vertical (corredor em pé, planta do celular). */
    vertical: boolean;
  };
  /**
    Trajeto dos pontos: `legs[0]` vai de fora da planta até a parada da Atração;
    `legs[i]` vai da parada da etapa i-1 até a parada da etapa i.
  */
  legs: Vec2[][];
  /** Marca de entrada (triângulo) e direção para dentro. */
  entrance: { at: Vec2; dir: Vec2; label: Vec2 };
  /** Cota geral: eixo 'x' (em cima) ou 'y' (à esquerda). */
  dimensionAxis: 'x' | 'y';
  /** Posição do norte, fora da planta. */
  north: Vec2;
  heights: { wall: number; sill: number };
  /** Câmera final da axonometria, em graus. */
  camera: { yaw: number; pitch: number };
  /** Probabilidade de seguir para a etapa seguinte, por etapa (5 valores). */
  pass: readonly number[];
  /** Intervalo entre entradas de pontos, em segundos [mín, máx]. */
  spawn: readonly [number, number];
  /** Velocidade dos pontos, em cm/s. */
  speed: number;
}
