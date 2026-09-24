/*
  Regras da candidatura, usadas no navegador (validação na hora) e no servidor (validação final).
  Sem dependências do Astro: roda nos dois lados.
*/

import { dialCodes, normalizePhone } from '../data/countries';
import { site, type Currency } from '../config/site';

export type Answers = {
  has_studio: 'yes' | 'no';
  role: 'architect' | 'interior' | 'owner' | 'other';
  name: string;
  phone_country: string;
  phone: string;
  email: string;
  presence: string;
  city: string;
  currency?: Currency;
  revenue?: string;
  challenge: 'few' | 'unqualified' | 'closing' | 'referrals' | 'other';
  challenge_other?: string;
  invest: 'now' | 'soon';
};

export type FieldError = 'choice' | 'name' | 'phone' | 'email' | 'presence' | 'city' | 'other';

const clean = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

export const validators = {
  has_studio: (v: Record<string, unknown>): FieldError | null => (v.has_studio === 'yes' || v.has_studio === 'no' ? null : 'choice'),
  role: (v: Record<string, unknown>): FieldError | null => (['architect', 'interior', 'owner', 'other'].includes(String(v.role)) ? null : 'choice'),
  name: (v: Record<string, unknown>): FieldError | null => (clean(v.name).length >= 2 ? null : 'name'),
  whatsapp: (v: Record<string, unknown>): FieldError | null =>
    dialCodes[String(v.phone_country)] && normalizePhone(String(v.phone_country), String(v.phone ?? '')) ? null : 'phone',
  email: (v: Record<string, unknown>): FieldError | null =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean(v.email, 254)) ? null : 'email',
  presence: (v: Record<string, unknown>): FieldError | null => {
    const s = clean(v.presence);
    return /^@?[\w.]{2,30}$/.test(s) || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(s) ? null : 'presence';
  },
  city: (v: Record<string, unknown>): FieldError | null => (clean(v.city).length >= 2 ? null : 'city'),
  revenue: (v: Record<string, unknown>): FieldError | null => {
    if (v.has_studio !== 'yes') return null;
    const bands = site.revenueBands[v.currency as Currency];
    return bands && bands.some((b) => b.id === v.revenue) ? null : 'choice';
  },
  challenge: (v: Record<string, unknown>): FieldError | null => {
    if (!['few', 'unqualified', 'closing', 'referrals', 'other'].includes(String(v.challenge))) return 'choice';
    return v.challenge === 'other' && clean(v.challenge_other).length < 2 ? 'other' : null;
  },
  invest: (v: Record<string, unknown>): FieldError | null => (v.invest === 'now' || v.invest === 'soon' ? null : 'choice'),
};

export type StepId = keyof typeof validators;

/** Ordem das perguntas. O faturamento só aparece para quem tem atelier. */
export const allSteps: StepId[] = ['has_studio', 'role', 'name', 'whatsapp', 'email', 'presence', 'city', 'revenue', 'challenge', 'invest'];

export function stepsFor(v: Record<string, unknown>): StepId[] {
  return v.has_studio === 'no' ? allSteps.filter((s) => s !== 'revenue') : allSteps;
}

/** Valida tudo. Devolve os erros por pergunta e, se estiver tudo certo, as respostas limpas. */
export function validateAll(v: Record<string, unknown>): { errors: Partial<Record<StepId, FieldError>>; answers?: Answers } {
  const errors: Partial<Record<StepId, FieldError>> = {};
  for (const step of stepsFor(v)) {
    const e = validators[step](v);
    if (e) errors[step] = e;
  }
  if (Object.keys(errors).length) return { errors };
  const hasStudio = v.has_studio === 'yes';
  return {
    errors,
    answers: {
      has_studio: v.has_studio as Answers['has_studio'],
      role: v.role as Answers['role'],
      name: clean(v.name, 120),
      phone_country: String(v.phone_country),
      phone: normalizePhone(String(v.phone_country), String(v.phone))!,
      email: clean(v.email, 254).toLowerCase(),
      presence: clean(v.presence),
      city: clean(v.city, 120),
      currency: hasStudio ? (v.currency as Currency) : undefined,
      revenue: hasStudio ? String(v.revenue) : undefined,
      challenge: v.challenge as Answers['challenge'],
      challenge_other: v.challenge === 'other' ? clean(v.challenge_other, 300) : undefined,
      invest: v.invest as Answers['invest'],
    },
  };
}

/** Prioridade simples: tem atelier e faixa de faturamento. */
export function priorityOf(a: Answers): { level: 'alta' | 'media' | 'baixa'; score: number } {
  if (a.has_studio !== 'yes') return { level: 'baixa', score: 0 };
  const band = a.currency ? site.revenueBands[a.currency].find((b) => b.id === a.revenue) : undefined;
  const score = 1 + (band?.priority ?? 0);
  return { level: score >= 3 ? 'alta' : 'media', score };
}

/** Número de WhatsApp de destino pelo país do telefone do lead. */
export function whatsappFor(country: string): string {
  const n = site.whatsapp.byCountry[country] ?? site.whatsapp.default;
  return n.replace(/\D/g, '');
}
