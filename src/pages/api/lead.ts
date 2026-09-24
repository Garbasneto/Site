/*
  Recebe a candidatura.
  - Valida no servidor (mesmas regras do navegador), com honeypot e tempo mínimo contra robôs.
  - Envia tudo para FORM_WEBHOOK_URL (Make, n8n, Zapier ou o próprio CRM).
  - Se houver PIPEDRIVE_API_TOKEN, cria pessoa, negócio e uma nota no Pipedrive.
  - Se o envio falhar, registra o erro com a candidatura completa (recuperável nos logs da Vercel)
    e responde 200 do mesmo jeito: a tela final e o WhatsApp não dependem do webhook.
*/

import type { APIRoute } from 'astro';
import { FORM_WEBHOOK_URL, PIPEDRIVE_API_TOKEN } from 'astro:env/server';
import { priorityOf, validateAll, whatsappFor, type Answers } from '../../lib/lead';
import { site } from '../../config/site';
import { path, type Locale } from '../../i18n';

export const prerender = false;

const LOCALES: Locale[] = ['pt', 'en', 'es'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

async function readBody(request: Request): Promise<{ data: Record<string, unknown>; isForm: boolean }> {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
    const fd = await request.formData();
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => (data[k] = String(v)));
    return { data, isForm: true };
  }
  const text = await request.text();
  try {
    return { data: JSON.parse(text || '{}'), isForm: false };
  } catch {
    return { data: {}, isForm: false };
  }
}

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '');

function attributionOf(raw: unknown) {
  const a = (raw && typeof raw === 'object' ? raw : {}) as { first?: Record<string, unknown>; last?: Record<string, unknown> };
  const touch = (t?: Record<string, unknown>) => {
    const params = (t?.params && typeof t.params === 'object' ? t.params : {}) as Record<string, unknown>;
    const pick = (k: string) => str(params[k], 250) || null;
    return {
      utm_source: pick('utm_source'),
      utm_medium: pick('utm_medium'),
      utm_campaign: pick('utm_campaign'),
      utm_content: pick('utm_content'),
      utm_term: pick('utm_term'),
      gclid: pick('gclid'),
      gbraid: pick('gbraid'),
      wbraid: pick('wbraid'),
      fbclid: pick('fbclid'),
      landing_page: str(t?.landing, 300) || null,
      referrer: str(t?.referrer, 300) || null,
      at: typeof t?.t === 'number' ? new Date(t.t).toISOString() : null,
    };
  };
  return { first_touch: touch(a.first), last_touch: touch(a.last ?? a.first) };
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${(await res.text()).slice(0, 300)}`);
  return res.json().catch(() => ({}));
}

async function toPipedrive(token: string, lead: ReturnType<typeof buildLead>) {
  const base = 'https://api.pipedrive.com/v1';
  const q = `?api_token=${encodeURIComponent(token)}`;
  const person = await post(`${base}/persons${q}`, {
    name: lead.answers.name,
    email: [{ value: lead.answers.email, primary: true, label: 'work' }],
    phone: [{ value: lead.answers.phone, primary: true, label: 'mobile' }],
  });
  const deal = await post(`${base}/deals${q}`, {
    title: `Candidatura · ${lead.answers.name} · ${lead.answers.city}`,
    person_id: person?.data?.id,
  });
  const a = lead.answers;
  const lines = [
    `Tem atelier: ${a.has_studio}`,
    `Perfil: ${a.role}`,
    `Instagram ou site: ${a.presence}`,
    `Cidade e país: ${a.city}`,
    a.revenue ? `Faturamento: ${a.revenue} (${a.currency})` : '',
    `Desafio: ${a.challenge}${a.challenge_other ? ` (${a.challenge_other})` : ''}`,
    `Investir: ${a.invest}`,
    `Prioridade: ${lead.priority.level}`,
    `Idioma: ${lead.language}`,
    `Origem: ${lead.attribution.last_touch.utm_source ?? '(direto)'} / ${lead.attribution.last_touch.utm_campaign ?? ''}`,
    `event_id: ${lead.event_id}`,
  ].filter(Boolean);
  await post(`${base}/notes${q}`, { deal_id: deal?.data?.id, content: lines.join('<br>') });
}

function buildLead(answers: Answers, data: Record<string, unknown>, request: Request) {
  const lang = LOCALES.includes(data.lang as Locale) ? (data.lang as Locale) : 'pt';
  return {
    event_id: str(data.event_id, 64) || crypto.randomUUID(),
    submitted_at: new Date().toISOString(),
    language: lang,
    answers,
    priority: priorityOf(answers),
    // Só dígitos; null enquanto o número do país estiver como [PREENCHER] em src/config/site.ts.
    whatsapp_destination: whatsappFor(answers.phone_country) || null,
    attribution: attributionOf(data.attribution),
    page: str(data.page, 200) || path('start', lang),
    visitor_country: request.headers.get('x-vercel-ip-country') || null,
    user_agent: str(request.headers.get('user-agent') ?? '', 300),
  };
}

export const POST: APIRoute = async ({ request }) => {
  const { data, isForm } = await readBody(request);
  const lang = LOCALES.includes(data.lang as Locale) ? (data.lang as Locale) : 'pt';
  const doneUrl = `${path('start', lang)}#recebida`;
  const ok = () => (isForm ? new Response(null, { status: 303, headers: { location: doneUrl } }) : json({ ok: true }));

  // Robôs: campo escondido preenchido ou envio rápido demais. Responde como sucesso, sem enviar nada.
  if (str(data.website)) {
    console.warn('[lead] honeypot preenchido, descartado');
    return ok();
  }
  const t0 = Number(data.t0);
  if (t0 && Date.now() - t0 < site.form.minFillMs) {
    console.warn('[lead] enviado rápido demais, descartado', Date.now() - t0, 'ms');
    return ok();
  }

  const { errors, answers } = validateAll(data);
  if (!answers) {
    if (isForm) return new Response(null, { status: 303, headers: { location: `${path('start', lang)}#erro` } });
    return json({ ok: false, errors }, 400);
  }

  const lead = buildLead(answers, data, request);
  const jobs: { name: string; run: () => Promise<unknown> }[] = [];
  if (FORM_WEBHOOK_URL) jobs.push({ name: 'webhook', run: () => post(FORM_WEBHOOK_URL!, lead) });
  if (PIPEDRIVE_API_TOKEN) jobs.push({ name: 'pipedrive', run: () => toPipedrive(PIPEDRIVE_API_TOKEN!, lead) });

  if (!jobs.length) {
    console.error('[lead] nenhum destino configurado (FORM_WEBHOOK_URL). Candidatura:', JSON.stringify(lead));
    return isForm ? ok() : json({ ok: true, delivered: false });
  }

  const results = await Promise.allSettled(jobs.map((j) => j.run()));
  const failed = results
    .map((r, i) => (r.status === 'rejected' ? `${jobs[i].name}: ${(r.reason as Error)?.message ?? r.reason}` : null))
    .filter(Boolean);
  if (failed.length) console.error('[lead] falha no envio:', failed.join(' | '), '· Candidatura:', JSON.stringify(lead));
  else console.info('[lead] entregue', lead.event_id, lead.priority.level);

  return isForm ? ok() : json({ ok: true, delivered: failed.length === 0 });
};
