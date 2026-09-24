/*
  Consentimento (Consent Mode v2). O padrão, negado, é definido no <head> antes de qualquer tag.
  A nota no canto oferece aceitar, recusar e preferências; a escolha fica no navegador por 12 meses.
*/

import { clearPersistedAttribution, persistAttribution } from './attribution';
import { track } from './track';

export interface Consent {
  v: 1;
  analytics: boolean;
  ads: boolean;
  t: number;
}

const KEY = 'hp-consent';
const MAX_AGE = 365 * 24 * 3600 * 1000;

type Gtag = (...args: unknown[]) => void;
const gtag: Gtag = (...args) => {
  const w = window as unknown as { gtag?: Gtag; dataLayer?: unknown[] };
  if (w.gtag) w.gtag(...args);
  else (w.dataLayer = w.dataLayer || []).push(args);
};

export function getConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null') as Consent | null;
    return c && c.v === 1 && Date.now() - c.t < MAX_AGE ? c : null;
  } catch {
    return null;
  }
}

function save(analytics: boolean, ads: boolean) {
  const c: Consent = { v: 1, analytics, ads, t: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* sem armazenamento: vale só nesta página */
  }
  gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: ads ? 'granted' : 'denied',
    ad_user_data: ads ? 'granted' : 'denied',
    ad_personalization: ads ? 'granted' : 'denied',
  });
  track('consent_update', { consent_analytics: analytics, consent_ads: ads });
  if (analytics || ads) persistAttribution();
  else clearPersistedAttribution();
  document.dispatchEvent(new CustomEvent('hp:consent', { detail: c }));
}

export function initConsent() {
  const note = document.querySelector<HTMLElement>('[data-cookie-note]');
  const existing = getConsent();
  if (existing && (existing.analytics || existing.ads)) persistAttribution();
  if (!note) return;

  const prefs = note.querySelector<HTMLElement>('[data-cookie-prefs]')!;
  const analytics = note.querySelector<HTMLInputElement>('input[name="consent-analytics"]')!;
  const ads = note.querySelector<HTMLInputElement>('input[name="consent-ads"]')!;
  const saveBtn = note.querySelector<HTMLButtonElement>('[data-consent="save"]')!;
  const prefsBtn = note.querySelector<HTMLButtonElement>('[data-consent="prefs"]')!;

  const open = (withPrefs = false) => {
    const c = getConsent();
    analytics.checked = c?.analytics ?? false;
    ads.checked = c?.ads ?? false;
    prefs.hidden = !withPrefs;
    saveBtn.hidden = !withPrefs;
    prefsBtn.setAttribute('aria-expanded', String(withPrefs));
    note.hidden = false;
    requestAnimationFrame(() => note.classList.add('is-visible'));
  };
  const close = () => {
    note.classList.remove('is-visible');
    note.hidden = true;
  };

  note.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-consent]')?.dataset.consent;
    if (action === 'accept') {
      save(true, true);
      close();
    } else if (action === 'reject') {
      save(false, false);
      close();
    } else if (action === 'prefs') {
      const show = prefs.hidden;
      prefs.hidden = !show;
      saveBtn.hidden = !show;
      prefsBtn.setAttribute('aria-expanded', String(show));
      if (show) analytics.focus();
    } else if (action === 'save') {
      save(analytics.checked, ads.checked);
      close();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-cookie-open]').forEach((b) => b.addEventListener('click', () => open(true)));
  if (!existing) open(false);
}
