import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
  Textos da página inicial, um arquivo por idioma: src/content/home/{pt,en,es}.yaml.
  O esquema abaixo só garante que nenhum campo fique esquecido.
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
  }),
});

export const collections = { home };
