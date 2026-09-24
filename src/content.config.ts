import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
  Conteúdo do site.
  - home: textos da página inicial, um arquivo por idioma (src/content/home/{pt,en,es}.yaml).
  - cases: um arquivo por case (src/content/cases/*.yaml), com um bloco por idioma.
  - depoimentos: um arquivo por depoimento (src/content/depoimentos/*.yaml), com um bloco por idioma.
  Cases e depoimentos só vão ao ar com `publicado: true`.
*/

const room = z.object({
  number: z.string(),
  name: z.string(),
  metric: z.string(),
});

const sheet = z.object({
  id: z.enum(['planta', 'servicos', 'projeto', 'resultados', 'palavra', 'para-quem', 'perguntas', 'iniciar']),
  /** Nome curto, em caixa alta no indicador ("F.03 · MÉTODO"). */
  label: z.string(),
  /** Nome grande no índice de folhas. */
  title: z.string(),
});

const home = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/home' }),
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),
    nav: z.object({
      skip: z.string(),
      home: z.string(),
      index: z.string(),
      cta: z.string(),
      language: z.string(),
      sheet_prefix: z.string(),
    }),
    sheets: z.array(sheet),
    index: z.object({
      title: z.string(),
      close: z.string(),
    }),
    drafts: z.object({
      watermark: z.string(),
    }),
    hero: z.object({
      plan_description: z.string(),
      rooms: z.object({
        atracao: room,
        formulario: room,
        whatsapp: room,
        diagnostico: room,
        proposta: room,
        contrato: room,
      }),
      circulation: z.string(),
      entrance: z.string(),
      dimension: z.string(),
      scale_unit: z.string(),
      north: z.string(),
      title_block: z.object({
        project_label: z.string(),
        project: z.string(),
        scale_label: z.string(),
        scale: z.string(),
        reach_label: z.string(),
        reach: z.string(),
        lead_label: z.string(),
        lead: z.string(),
        date_label: z.string(),
        sheet_label: z.string(),
      }),
      cta: z.string(),
    }),
    manifesto: z.object({
      lines: z.array(z.string()).length(2),
      body: z.string(),
    }),
    services: z.object({
      title: z.string(),
      lead: z.string(),
      deliverables_label: z.string(),
      items: z
        .array(
          z.object({
            number: z.string(),
            name: z.string(),
            summary: z.string(),
            deliverables: z.array(z.string()),
            drawing: z.enum(['strategy', 'ads', 'funnel', 'crm', 'seo', 'data']),
          }),
        )
        .length(6),
    }),
    project: z.object({
      title: z.string(),
      lead: z.string(),
      phase_label: z.string(),
      deliverable_label: z.string(),
      /** "Dias {from} a {to}" */
      days: z.string(),
      axis_unit: z.string(),
      phases: z.array(
        z.object({
          number: z.string(),
          name: z.string(),
          from: z.number(),
          to: z.number(),
          body: z.string(),
          deliverable: z.string(),
        }),
      ),
      specs: z.object({
        label: z.string(),
        title: z.string(),
        items: z.array(z.string()),
      }),
    }),
    results: z.object({
      title: z.string(),
      lead: z.string(),
      case_label: z.string(),
      challenge_label: z.string(),
      done_label: z.string(),
      period_label: z.string(),
      source_label: z.string(),
      evolution_label: z.string(),
    }),
    testimonials: z.object({
      title: z.string(),
      prev: z.string(),
      next: z.string(),
      /** "Tradução do original em {lang}" */
      translated: z.string(),
      play: z.string(),
      languages: z.object({ pt: z.string(), en: z.string(), es: z.string() }),
    }),
    fit: z.object({
      title: z.string(),
      yes_title: z.string(),
      no_title: z.string(),
      yes: z.array(z.string()),
      no: z.array(z.string()),
      lead_label: z.string(),
      lead_name: z.string(),
      lead_role: z.string(),
      lead_text: z.string(),
      lead_bio: z.string(),
      lead_link: z.string(),
      photo_placeholder: z.string(),
    }),
    faq: z.object({
      title: z.string(),
      items: z.array(z.object({ q: z.string(), a: z.string() })),
    }),
    cta: z.object({
      title: z.string(),
      button: z.string(),
      support: z.string(),
      /** Opcional: vagas por trimestre, só se for real. */
      slots: z.string().optional(),
    }),
    footer: z.object({
      tagline: z.string(),
      email: z.string(),
      whatsapp: z.string(),
      instagram: z.string(),
      cities: z.string(),
      language: z.string(),
      privacy: z.string(),
      cookies: z.string(),
      sheet: z.string(),
      signature: z.string(),
      complaints: z.string(),
    }),
    notfound: z.object({
      title: z.string(),
      back: z.string(),
    }),
  }),
});

const l10n = z.object({ pt: z.string(), en: z.string(), es: z.string() });

const cases = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/cases' }),
  schema: ({ image }) =>
    z.object({
      publicado: z.boolean(),
      ordem: z.number(),
      cidade: z.string(),
      pais: l10n,
      coordenadas: z.object({ lat: z.number(), lng: z.number() }),
      cliente: l10n,
      desafio: l10n,
      feito: l10n,
      numeros: z
        .array(
          z.object({
            /** Número real (ex.: 38) ou [PREENCHER]. */
            valor: z.union([z.number(), z.string()]),
            prefixo: z.string().default(''),
            sufixo: z.string().default(''),
            casas: z.number().default(0),
            metrica: l10n,
            periodo: l10n,
            fonte: l10n,
          }),
        )
        .min(1)
        .max(3),
      /** Série real, em ordem, para a linha de evolução (opcional). */
      serie: z.array(z.number()).default([]),
      foto: image().optional(),
      foto_alt: l10n.optional(),
      frase: l10n.optional(),
    }),
});

const depoimentos = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/depoimentos' }),
  schema: ({ image }) =>
    z.object({
      publicado: z.boolean(),
      ordem: z.number(),
      /** Idioma em que o cliente falou. As outras versões são marcadas como tradução. */
      original: z.enum(['pt', 'en', 'es']),
      nome: z.string(),
      funcao: l10n,
      atelier: z.string(),
      cidade: z.string(),
      texto: l10n,
      video: z
        .object({
          url: z.string(),
          capa: image().optional(),
        })
        .optional(),
    }),
});

export const collections = { home, cases, depoimentos };
