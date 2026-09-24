/*
  Configurações do site num único arquivo.
  Tudo o que está marcado [PREENCHER] precisa de um dado real antes de publicar.
*/

export type Currency = 'EUR' | 'USD' | 'BRL';

export interface RevenueBand {
  id: string;
  label: string;
  /** Peso usado na prioridade do lead (0 a 3). */
  priority: number;
}

export const site = {
  name: 'Hub Performance',
  /** Domínio oficial [confirmar]. */
  domain: 'hubperformance.io',
  email: '[PREENCHER: e-mail de contato]',
  instagram: {
    handle: '@grupohub.co',
    url: 'https://www.instagram.com/grupohub.co/',
  },
  founder: {
    name: '[PREENCHER: nome completo do fundador]',
    instagram: '[PREENCHER: link do Instagram pessoal]',
  },
  cities: ['[PREENCHER: cidades]'],
  /** Se a empresa for portuguesa, link do Livro de Reclamações Eletrónico [confirmar]. */
  complaintsBookUrl: '',

  /*
    WhatsApp de destino por país do telefone do lead (código ISO de 2 letras).
    Números só com dígitos, com código do país. Ex.: 351912345678.
  */
  whatsapp: {
    default: '[PREENCHER: número padrão]',
    byCountry: {
      PT: '[PREENCHER: número para Portugal]',
      BR: '[PREENCHER: número para o Brasil]',
      ES: '[PREENCHER: número para Espanha]',
      US: '[PREENCHER: número para os EUA]',
    } as Record<string, string>,
  },

  form: {
    /** 'native' usa o formulário do site; 'external' manda todos os botões para o Respondi. */
    mode: (import.meta.env.FORM_MODE === 'external' ? 'external' : 'native') as 'native' | 'external',
    respondiUrl: '[PREENCHER: URL do formulário no Respondi]',
    /** Tempo mínimo (ms) entre abrir e enviar, contra robôs. */
    minFillMs: 4000,
  },

  /* Faixas de faturamento médio mensal por moeda [PREENCHER com as faixas reais]. */
  revenueBands: {
    EUR: [
      { id: 'eur-1', label: '[PREENCHER: faixa 1 em €]', priority: 0 },
      { id: 'eur-2', label: '[PREENCHER: faixa 2 em €]', priority: 1 },
      { id: 'eur-3', label: '[PREENCHER: faixa 3 em €]', priority: 2 },
      { id: 'eur-4', label: '[PREENCHER: faixa 4 em €]', priority: 3 },
    ],
    USD: [
      { id: 'usd-1', label: '[PREENCHER: faixa 1 em US$]', priority: 0 },
      { id: 'usd-2', label: '[PREENCHER: faixa 2 em US$]', priority: 1 },
      { id: 'usd-3', label: '[PREENCHER: faixa 3 em US$]', priority: 2 },
      { id: 'usd-4', label: '[PREENCHER: faixa 4 em US$]', priority: 3 },
    ],
    BRL: [
      { id: 'brl-1', label: '[PREENCHER: faixa 1 em R$]', priority: 0 },
      { id: 'brl-2', label: '[PREENCHER: faixa 2 em R$]', priority: 1 },
      { id: 'brl-3', label: '[PREENCHER: faixa 3 em R$]', priority: 2 },
      { id: 'brl-4', label: '[PREENCHER: faixa 4 em R$]', priority: 3 },
    ],
  } satisfies Record<Currency, RevenueBand[]>,
} as const;
