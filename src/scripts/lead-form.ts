/*
  Candidatura: uma pergunta por tela.
  - Enter avança; nas escolhas, clicar avança e as letras A a E selecionam.
  - Validação na hora, com a mesma regra do servidor (src/lib/lead.ts).
  - Transição por máscara (só transform e opacity), respeitando movimento reduzido.
  - Se o envio falhar, a tela final aparece do mesmo jeito, com o WhatsApp. Nenhum lead se perde.
*/

import { stepsFor, validators, whatsappFor, type FieldError, type StepId } from '../lib/lead';
import { currencyFor, dialCodes, flag } from '../data/countries';
import { getAttribution } from './attribution';
import { track } from './track';

interface Config {
  lang: 'pt' | 'en' | 'es';
  errors: Record<FieldError, string>;
  progress: string;
  message: string;
  defaultCountry: string;
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n: number) => String(n).padStart(2, '0');
const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

function uuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function init() {
  const form = document.querySelector<HTMLFormElement>('[data-lead-form]');
  const cfgEl = document.querySelector<HTMLScriptElement>('[data-form-config]');
  if (!form || !cfgEl) return;
  const cfg = JSON.parse(cfgEl.textContent || '{}') as Config;

  const intro = form.querySelector<HTMLElement>('[data-intro]')!;
  const stepsEl = new Map<StepId, HTMLElement>();
  form.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => stepsEl.set(el.dataset.step as StepId, el));
  const back = form.querySelector<HTMLButtonElement>('[data-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const privacy = form.querySelector<HTMLElement>('[data-privacy]')!;
  const fillBar = document.querySelector<HTMLElement>('[data-progress-fill]');
  const current = document.querySelector<HTMLElement>('[data-progress-current]');
  const total = document.querySelector<HTMLElement>('[data-progress-total]');
  const live = document.querySelector<HTMLElement>('[data-progress-live]');
  const done = document.querySelector<HTMLElement>('[data-done]')!;
  const country = form.querySelector<HTMLSelectElement>('[data-country]')!;
  const currency = form.querySelector<HTMLSelectElement>('[data-currency]')!;
  const other = form.querySelector<HTMLInputElement>('[data-other]')!;

  const t0 = Date.now();
  (form.elements.namedItem('t0') as HTMLInputElement).value = String(t0);
  const eventId = uuid();

  let order: StepId[] = stepsFor({});
  let index = 0;
  let started = false;
  let busy = false;
  let countryTouched = false;
  let currencyTouched = false;

  const values = (): Record<string, string> => {
    const out: Record<string, string> = {};
    new FormData(form).forEach((v, k) => (out[k] = String(v)));
    return out;
  };

  const markStarted = () => {
    if (started) return;
    started = true;
    track('form_start', { form_language: cfg.lang });
  };

  /* Estado da tela */

  const render = () => {
    const id = order[index];
    stepsEl.forEach((el, k) => el.classList.toggle('is-current', k === id));
    intro.classList.toggle('is-compact', index > 0);
    const n = index + 1;
    stepsEl.get(id)!.querySelector('[data-step-n]')!.textContent = pad(n);
    if (current) current.textContent = pad(n);
    if (total) total.textContent = pad(order.length);
    if (fillBar) fillBar.style.transform = `scaleX(${index / order.length})`;
    if (live) live.textContent = fill(cfg.progress, { current: n, total: order.length });
    back.hidden = index === 0;
    const last = index === order.length - 1;
    next.classList.toggle('is-hidden', last);
    submit.classList.toggle('is-visible', last);
    privacy.classList.toggle('is-visible', last);
  };

  const focusStep = (id: StepId) => {
    const el = stepsEl.get(id)!;
    const target =
      el.querySelector<HTMLInputElement>('input[type="radio"]:checked:not(:disabled)') ??
      el.querySelector<HTMLInputElement>('input:not([type="radio"]):not([disabled]):not([data-other]), input[type="radio"]:not(:disabled)');
    target?.focus({ preventScroll: true });
  };

  const setError = (id: StepId, error: FieldError | null) => {
    const el = stepsEl.get(id)!;
    const msg = el.querySelector<HTMLElement>('[data-error]')!;
    msg.textContent = error ? cfg.errors[error] : '';
    msg.setAttribute('role', error ? 'alert' : 'none');
    el.querySelectorAll<HTMLInputElement>('input:not([type="radio"])').forEach((i) => i.setAttribute('aria-invalid', String(!!error)));
    if (!msg.id) msg.id = `err-${id}`;
    el.querySelectorAll('input, select').forEach((i) => (error ? i.setAttribute('aria-describedby', msg.id) : i.removeAttribute('aria-describedby')));
  };

  const validateStep = (id: StepId) => validators[id](values());

  /* Transição por máscara entre perguntas */

  const animateIn = (el: HTMLElement, dir: number) => {
    if (reduced) return;
    const titles = el.querySelectorAll<HTMLElement>('.lf__title:not([hidden])');
    titles.forEach((t) =>
      t.animate([{ transform: `translateY(${105 * dir}%)` }, { transform: 'translateY(0)' }], { duration: 800, easing: EASE }),
    );
    el.querySelectorAll<HTMLElement>('[data-field], .lf__n').forEach((f, i) =>
      f.animate([{ opacity: 0, transform: `translateY(${16 * dir}px)` }, { opacity: 1, transform: 'none' }], {
        duration: 700,
        delay: 80 + i * 40,
        easing: EASE,
        fill: 'backwards',
      }),
    );
  };

  const animateOut = async (el: HTMLElement, dir: number) => {
    if (reduced) return;
    const anims = [
      ...[...el.querySelectorAll<HTMLElement>('.lf__title:not([hidden])')].map((t) =>
        t.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-105 * dir}%)` }], { duration: 320, easing: EASE, fill: 'forwards' }),
      ),
      ...[...el.querySelectorAll<HTMLElement>('[data-field], .lf__n')].map((f) =>
        f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'linear', fill: 'forwards' }),
      ),
    ];
    await Promise.all(anims.map((a) => a.finished.catch(() => undefined)));
    anims.forEach((a) => a.cancel());
  };

  const goTo = async (to: number) => {
    if (busy || to === index || to < 0 || to >= order.length) return;
    busy = true;
    const dir = to > index ? 1 : -1;
    await animateOut(stepsEl.get(order[index])!, dir);
    index = to;
    render();
    const id = order[index];
    animateIn(stepsEl.get(id)!, dir);
    focusStep(id);
    track('form_step', { step_number: index + 1, step_id: id, steps_total: order.length });
    window.scrollTo({ top: 0 });
    busy = false;
  };

  const forward = () => {
    const id = order[index];
    const error = validateStep(id);
    setError(id, error);
    if (error) {
      focusStep(id);
      return;
    }
    markStarted();
    if (index < order.length - 1) goTo(index + 1);
    else form.requestSubmit();
  };

  /* Campos que mudam outras perguntas */

  const syncStudio = () => {
    const v = values();
    order = stepsFor(v);
    form.querySelectorAll<HTMLElement>('[data-when-studio]').forEach((t) => (t.hidden = t.dataset.whenStudio !== (v.has_studio || 'yes')));
    render();
  };

  const syncCountry = () => {
    const c = country.value;
    const face = form.querySelector<HTMLElement>('[data-country-flag]');
    const dial = form.querySelector<HTMLElement>('[data-country-dial]');
    if (face) face.textContent = flag(c);
    if (dial) dial.textContent = `+${dialCodes[c] ?? ''}`;
    if (!currencyTouched) {
      currency.value = currencyFor(c);
      syncCurrency();
    }
  };

  const syncCurrency = () => {
    form.querySelectorAll<HTMLElement>('[data-bands]').forEach((group) => {
      const on = group.dataset.bands === currency.value;
      group.hidden = !on;
      group.querySelectorAll<HTMLInputElement>('input').forEach((i) => {
        i.disabled = !on;
        if (!on) i.checked = false;
      });
    });
  };

  const syncOther = () => {
    const on = values().challenge === 'other';
    other.classList.toggle('is-visible', on);
    if (on) other.focus({ preventScroll: true });
  };

  /* Eventos */

  next.addEventListener('click', forward);
  back.addEventListener('click', () => goTo(index - 1));

  let pointerChoice = false;
  form.addEventListener('pointerdown', (e) => {
    pointerChoice = !!(e.target as HTMLElement).closest('.lf__choice');
  });

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    const el = e.target as Element;
    markStarted();
    if (t.name === 'has_studio') syncStudio();
    if (t.name === 'challenge') syncOther();
    if (el === country) {
      countryTouched = true;
      syncCountry();
    }
    if (el === currency) {
      currencyTouched = true;
      syncCurrency();
    }
    if (t.type === 'radio') {
      setError(order[index], null);
      // Clicar numa opção avança; com o teclado, a pessoa confirma com Enter.
      // Na última pergunta não envia sozinho: o botão e a nota de privacidade ficam à vista.
      const last = index === order.length - 1;
      if (pointerChoice && !last && !(t.name === 'challenge' && t.value === 'other')) window.setTimeout(forward, 260);
      pointerChoice = false;
    }
  });

  form.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.type === 'radio') return;
    const id = order[index];
    // Depois de um erro, revalida enquanto a pessoa corrige.
    if (stepsEl.get(id)!.querySelector('[data-error]')!.textContent) setError(id, validateStep(id));
  });

  // No documento, para os atalhos funcionarem antes de qualquer campo ter foco.
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t !== document.body && !form.contains(t)) return;
    if (done.classList.contains('is-visible')) return;
    if (e.key === 'Enter' && !(t instanceof HTMLButtonElement) && !(t instanceof HTMLAnchorElement)) {
      e.preventDefault();
      forward();
      return;
    }
    // Atalhos de letra nas escolhas.
    if (e.metaKey || e.ctrlKey || e.altKey || t instanceof HTMLSelectElement) return;
    if (t instanceof HTMLInputElement && t.type !== 'radio') return;
    const k = e.key.toUpperCase();
    const i = 'ABCDE'.indexOf(k);
    if (i < 0 || k.length !== 1) return;
    const step = stepsEl.get(order[index])!;
    const radios = [...step.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)')];
    if (!radios[i]) return;
    e.preventDefault();
    radios[i].checked = true;
    radios[i].focus();
    radios[i].dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* Envio */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = values();
    order = stepsFor(v);
    for (let i = 0; i < order.length; i++) {
      const err = validators[order[i]](v);
      if (err) {
        await goTo(i);
        setError(order[i], err);
        return;
      }
    }
    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    const label = submit.querySelector('[data-submit-label]');
    if (label) label.textContent = submit.dataset.sending || '';

    const payload = {
      ...v,
      event_id: eventId,
      page: location.pathname,
      attribution: getAttribution(),
    };
    track('generate_lead', {
      form_language: cfg.lang,
      has_studio: v.has_studio,
      revenue_band: v.revenue || null,
      currency: v.has_studio === 'yes' ? v.currency : null,
      event_id: eventId,
    });

    const body = JSON.stringify(payload);
    let delivered = false;
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
        signal: ctrl.signal,
      });
      window.clearTimeout(timer);
      delivered = res.ok;
    } catch {
      delivered = false;
    }
    // Segunda tentativa, sem esperar resposta (sobrevive até a troca de página).
    if (!delivered && navigator.sendBeacon) navigator.sendBeacon(form.action, new Blob([body], { type: 'application/json' }));

    showDone(v);
  });

  const showDone = (v: Record<string, string>) => {
    const number = whatsappFor(v.phone_country);
    const studio = v.presence || v.city || '';
    const text = fill(cfg.message, { name: (v.name || '').trim(), studio });
    const link = document.querySelector<HTMLAnchorElement>('[data-wa-link]');
    if (link) link.href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    if (fillBar) fillBar.style.transform = 'scaleX(1)';
    done.classList.add('is-visible');
    history.replaceState(null, '', '#recebida');
    window.scrollTo({ top: 0 });
    if (!reduced) {
      done.querySelectorAll<HTMLElement>(':scope > *').forEach((el, i) =>
        el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
          duration: 800,
          delay: i * 70,
          easing: EASE,
          fill: 'backwards',
        }),
      );
    }
    done.focus({ preventScroll: true });
  };

  /* País do visitante (geolocalização da Vercel); na falta, o padrão pelo idioma. */
  fetch('/api/geo')
    .then((r) => (r.ok ? r.json() : null))
    .then((g: { country?: string } | null) => {
      const c = g?.country?.toUpperCase();
      if (c && dialCodes[c] && !countryTouched) {
        country.value = c;
        syncCountry();
      }
    })
    .catch(() => undefined);

  syncCountry();
  syncCurrency();
  syncStudio();
  render();
  // Voltando para uma página já enviada (#recebida), mostra a tela final.
  if (location.hash === '#recebida') done.classList.add('is-visible');
}

init();
