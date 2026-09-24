/* Eventos vão só para o dataLayer; as tags (GA4, Meta, Google Ads) ficam no Google Tag Manager. */

type DataLayer = Record<string, unknown>[];

export function track(event: string, params: Record<string, unknown> = {}) {
  const w = window as unknown as { dataLayer?: DataLayer };
  (w.dataLayer = w.dataLayer || []).push({ event, ...params });
}
