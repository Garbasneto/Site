/*
  Origem da visita: UTMs e IDs de clique (gclid, gbraid, wbraid, fbclid), página de entrada e site de origem.
  - Na sessão (sessionStorage): sempre, para seguir com o formulário.
  - Entre visitas (localStorage, primeiro e último toque, 90 dias): só com consentimento de análise ou publicidade.
*/

export const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid'] as const;

export interface Touch {
  params: Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>;
  landing: string;
  referrer: string;
  t: number;
}

interface Store {
  first: Touch;
  last: Touch;
}

const SESSION_KEY = 'hp-touch';
const LOCAL_KEY = 'hp-attribution';
const MAX_AGE = 90 * 24 * 3600 * 1000;

function read(storage: Storage | undefined, key: string): Store | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as Store) : null;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, key: string, value: Store) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    /* navegação privada ou armazenamento bloqueado */
  }
}

const safe = (fn: () => Storage) => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

export function captureAttribution() {
  const url = new URL(location.href);
  const params: Touch['params'] = {};
  for (const k of ATTRIBUTION_KEYS) {
    const v = url.searchParams.get(k);
    if (v) params[k] = v.slice(0, 250);
  }
  let referrer = '';
  try {
    const r = document.referrer ? new URL(document.referrer) : null;
    if (r && r.host !== location.host) referrer = r.origin;
  } catch {
    /* sem referrer */
  }
  const touch: Touch = { params, landing: location.pathname, referrer, t: Date.now() };
  const session = safe(() => sessionStorage);
  const current = read(session, SESSION_KEY);
  const next: Store = current ?? { first: touch, last: touch };
  if (Object.keys(params).length || (!current && referrer)) next.last = touch;
  write(session, SESSION_KEY, next);
}

/** Com consentimento: guarda primeiro e último toque entre visitas. */
export function persistAttribution() {
  const session = read(safe(() => sessionStorage), SESSION_KEY);
  if (!session) return;
  const local = safe(() => localStorage);
  const stored = read(local, LOCAL_KEY);
  const fresh = stored && Date.now() - stored.first.t < MAX_AGE ? stored : null;
  const hasParams = (t: Touch) => Object.keys(t.params).length > 0;
  write(local, LOCAL_KEY, {
    first: fresh?.first ?? session.first,
    last: hasParams(session.last) || !fresh ? session.last : fresh.last,
  });
}

export function clearPersistedAttribution() {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* nada */
  }
}

export function getAttribution(): Store | null {
  const session = read(safe(() => sessionStorage), SESSION_KEY);
  const local = read(safe(() => localStorage), LOCAL_KEY);
  if (!session && !local) return null;
  return {
    first: local?.first ?? session!.first,
    last: session && Object.keys(session.last.params).length ? session.last : (local?.last ?? session!.last),
  };
}

/** Parâmetros de campanha atuais, para repassar ao formulário externo (Respondi). */
export function campaignParams(): URLSearchParams {
  const a = getAttribution();
  const out = new URLSearchParams();
  const p = { ...(a?.first.params ?? {}), ...(a?.last.params ?? {}) };
  for (const [k, v] of Object.entries(p)) if (v) out.set(k, v);
  return out;
}
