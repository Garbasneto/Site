// @ts-check
import { defineConfig } from 'astro/config';
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
  devToolbar: { enabled: false },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
