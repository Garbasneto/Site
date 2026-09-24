export const locales = ['pt', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

/** Atributo lang do <html> e hreflang. */
export const htmlLang: Record<Locale, string> = {
  pt: 'pt',
  en: 'en-US',
  es: 'es-ES',
};

/** Rotas equivalentes em cada idioma. */
const routes = {
  home: { pt: '/', en: '/en', es: '/es' },
  start: { pt: '/iniciar', en: '/en/start', es: '/es/iniciar' },
  privacy: { pt: '/privacidade', en: '/en/privacy', es: '/es/privacidad' },
  cookies: { pt: '/cookies', en: '/en/cookies', es: '/es/cookies' },
} as const;

export type RouteKey = keyof typeof routes;

export function path(route: RouteKey, lang: Locale): string {
  return routes[route][lang];
}

export function alternates(route: RouteKey): Record<Locale, string> {
  return routes[route];
}

/** Data do carimbo, sempre com 10 caracteres para o layout não mexer. */
export function formatSheetDate(date: Date, lang: Locale): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return lang === 'en' ? `${mm}.${dd}.${yyyy}` : `${dd}.${mm}.${yyyy}`;
}

/** Separador decimal por idioma (coordenadas do cursor). */
export const decimalSeparator: Record<Locale, string> = { pt: ',', en: '.', es: ',' };
