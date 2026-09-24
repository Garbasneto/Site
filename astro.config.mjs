// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// Domínio oficial [confirmar]. Usado em canonical, hreflang, sitemap e Open Graph.
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://hubperformance.io';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  adapter: vercel(),
  env: {
    schema: {
      // Google Tag Manager [PREENCHER]. Sem ele, os eventos vão só para o dataLayer.
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      // native: formulário do site. external: todos os botões vão para o Respondi.
      FORM_MODE: envField.enum({ context: 'server', access: 'public', values: ['native', 'external'], default: 'native' }),
      // Destino das candidaturas (Make, n8n, Zapier ou CRM) [PREENCHER].
      FORM_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Opcional: cria pessoa e negócio no Pipedrive.
      PIPEDRIVE_API_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  devToolbar: { enabled: false },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
