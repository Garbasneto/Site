# Site da Hub Performance

Página única com oito folhas de projeto, em português, inglês e espanhol. Feito com Astro, publicado na Vercel.

## Rodar no computador

Precisa do Node.js 22 (https://nodejs.org, versão LTS) e do git.

```
npm install
npm run dev
```

Abra http://localhost:4321. As versões em inglês e espanhol ficam em /en e /es.

## Como editar os textos

Todos os textos estão em `src/content/`, um arquivo por idioma:

- `src/content/home/pt.yaml`: página inicial em português
- `src/content/home/en.yaml`: inglês
- `src/content/home/es.yaml`: espanhol

Abra o arquivo, troque o texto entre aspas e salve. Não mexa no nome antes dos dois-pontos. Depois rode:

```
npm run check
```

Ele avisa se algum texto tem travessão, meia-risca ou palavra proibida (lista em `CLAUDE.md`).

## Como trocar o WhatsApp, e-mail e outros dados

Tudo fica num único arquivo: `src/config/site.ts`.

- WhatsApp: em `whatsapp.byCountry`, um número por país (código de 2 letras: PT, BR, ES, US). Só dígitos, com o código do país. Ex.: `'351912345678'`. O `default` é usado quando o país do lead não está na lista.
- E-mail, Instagram, cidades, faixas de faturamento e o modo do formulário também estão lá.

## Como publicar um case

Cada case é um arquivo em `src/content/cases/` (hoje: `porto.yaml`, `algarve.yaml`, `madrid.yaml`, os slots sugeridos). Dentro dele, os textos vêm em três blocos (`pt`, `en`, `es`) e os números ficam uma vez só, para nunca haver um número diferente por idioma.

1. Abra o arquivo do case e troque cada `[PREENCHER: ...]` pelo dado real.
2. Em `numeros`, coloque o valor como número (ex.: `valor: 38`), com `sufixo: "%"` ou `prefixo: "€"` se precisar. Sempre com período e fonte.
3. Opcional: foto de um projeto do cliente (com autorização) em `src/assets/cases/` e a linha `foto:` descomentada. O site gera AVIF e WebP em vários tamanhos.
4. Opcional: `serie` com os valores reais em ordem (ex.: pedidos por semana). Só com série real aparece a linha de evolução.
5. Mude `publicado: false` para `publicado: true`.

Enquanto `publicado` for `false`, o case aparece só no computador (`npm run dev`), com a marca "EXEMPLO". No site publicado ele não existe. Se nenhum case estiver publicado, a folha Resultados e o item do índice somem, e a numeração das folhas se ajusta sozinha.

Para um case novo, copie um dos arquivos e mude o nome, a cidade, as coordenadas e a `ordem`.

## Como publicar um depoimento

Igual aos cases, em `src/content/depoimentos/`. O campo `original` diz em que idioma o cliente falou; nas outras línguas o site mostra a nota "Tradução do original em ...". Vídeo é opcional (arquivo .mp4 em `public/` ou link do YouTube ou Vimeo, com capa em `src/assets/depoimentos/`).

## Foto do fundador

Salve a foto como `src/assets/fundador.jpg` (ou `.png` ou `.webp`). Ela aparece automaticamente em preto e branco na folha "Para quem é". O nome, a trajetória e o link do Instagram ficam em `src/content/home/*.yaml` (bloco `fit`) e em `src/config/site.ts` (`founder`).

## Planta do hero

A planta é desenhada a partir de números em `src/data/plan.ts` (paredes, portas, janelas, ambientes e o trajeto dos pontos). Para mudar a planta, mude os números: o desenho plano e a axonometria se ajustam sozinhos. Os nomes dos ambientes vêm dos arquivos de texto.

## Formulário de candidatura

A candidatura fica em `/iniciar` (EN `/en/start`, ES `/es/iniciar`): uma pergunta por tela, Enter avança, letras A a E escolhem as opções. Os textos estão em `src/content/form/*.yaml`; as faixas de faturamento por moeda, em `src/config/site.ts` (`revenueBands`, cada faixa com uma `priority` de 0 a 3).

Para onde vão as respostas (variáveis na Vercel, em Settings > Environment Variables):

- `FORM_WEBHOOK_URL`: endereço do cenário no Make, n8n ou Zapier. Recebe um JSON com as respostas, o idioma, a prioridade (alta, media, baixa), o número de WhatsApp de destino, a origem da visita (primeiro e último toque: UTMs, gclid, gbraid, wbraid, fbclid, página de entrada, site de origem), o país aproximado e o `event_id` (o mesmo enviado ao dataLayer, para deduplicar conversões).
- `PIPEDRIVE_API_TOKEN` (opcional): cria pessoa, negócio e uma nota com o resumo no Pipedrive.
- Se o envio falhar, a pessoa vê a tela final e o botão do WhatsApp do mesmo jeito. A candidatura completa fica registrada nos logs da Vercel (Deployments > Functions > Logs, procure por `[lead]`).
- Proteção contra robôs: campo escondido (honeypot) e tempo mínimo de preenchimento (`form.minFillMs`).
- O formulário também funciona sem JavaScript (envio normal da página).

WhatsApp de destino: `whatsapp.byCountry` em `src/config/site.ts`, pelo país do telefone de quem se candidata, com `whatsapp.default` para os outros países. O país do seletor vem da localização da Vercel; sem ela, do idioma da página.

Modo alternativo: `FORM_MODE=external` faz todos os botões "Iniciar projeto" apontarem para o Respondi (`form.respondiUrl` em `src/config/site.ts`), levando as UTMs junto. Enquanto a URL estiver como `[PREENCHER]`, o site continua com o formulário próprio.

## Medição (GTM) e cookies

- `PUBLIC_GTM_ID` (ex.: `GTM-XXXXXXX`): o Google Tag Manager entra depois da página carregar. As tags (GA4, Google Ads, Meta) são configuradas no GTM, não no código.
- Modo de Consentimento v2: tudo negado por padrão, até a pessoa aceitar na nota de cookies. A escolha fica guardada por 12 meses e pode ser mudada no rodapé ("Preferências de cookies") ou na página de Cookies.
- Eventos no dataLayer: `cta_click` (com `cta_position`), `form_start`, `form_step`, `generate_lead` (com `event_id`), `whatsapp_click`, `language_change` e `consent_update`.
- Origem da visita: guardada na sessão sempre; entre visitas (90 dias, primeiro e último toque) só com consentimento.

## Páginas legais

Privacidade e Cookies ficam em `src/content/legal/{pt,en,es}/` (Markdown). São rascunhos: enquanto houver `[PREENCHER]`, a página mostra "Rascunho · revisão jurídica pendente", fica fora do Google (noindex) e fora do sitemap. Depois da revisão jurídica, troque os `[PREENCHER]` e atualize a data em `updated`.

## SEO

- Cada página tem canonical, hreflang (pt, en, es e x-default) e Open Graph por idioma.
- `sitemap.xml` e `robots.txt` são gerados no build.
- Imagens de partilha (1200x630) em `public/og/{pt,en,es}.png`, feitas a partir do hero real. Para refazer depois de mudar o título: `PUBLIC_DRAFTS=off npm run dev` (o site como vai ao ar, sem exemplos) e, em outro terminal, `npm run og`.
- Dados estruturados: Organization, ProfessionalService (as áreas atendidas entram quando `areasServed` for preenchido em `src/config/site.ts`) e FAQPage (só com respostas preenchidas).
- O site nunca redireciona pelo idioma do navegador: mostra uma sugestão discreta, que some ao fechar.

## Revisão visual

```
npm run dev
npm run shots          (hero: abertura aos 0,5 s, 1,5 s e 3 s e três pontos da extrusão)
npm run shots:sheets   (todas as folhas, o índice, a grelha da tecla G e a 404)
```

As imagens ficam em `screenshots/` (celular 390x844 e desktop 1440x900). Na primeira vez, rode `npx playwright install chromium`.

Dica: no desktop, a tecla G mostra a grelha de 12 colunas por cima do site.

## Pendências para revisar antes de publicar

Marcadas no briefing como [confirmar], [validar] ou [PREENCHER]:

- [confirmar] Domínio: hubperformance.io (`astro.config.mjs` e `src/config/site.ts`).
- [confirmar] Livro de Reclamações Eletrónico, se a empresa for portuguesa.
- [validar] Prazos das fases do projeto de 90 dias (dias 1 a 4, 5 a 8, 9 a 14, 15 a 75, 76 a 90).
- [validar] "As campanhas entram no ar ao fim da segunda semana", junto com os prazos das fases.
- [confirmar] Se todos os itens da memória descritiva entram no projeto.
- [PREENCHER] Logo em SVG (`public/brand/logo.svg`). Até lá, wordmark tipográfico provisório.
- [PREENCHER] Nome completo, foto em preto e branco, trajetória e Instagram pessoal do fundador.
- [PREENCHER] Faturamento mínimo mensal para "Para quem é".
- [PREENCHER] Cases reais (slots sugeridos: Porto, Algarve, Madrid), com números, período e fonte.
- [PREENCHER] Depoimentos reais (até lá, 3 placeholders).
- [PREENCHER] Valor mínimo de referência da verba de mídia.
- [PREENCHER] Países e idioma do atendimento.
- [PREENCHER] O que fica com o atelier se não houver renovação.
- [PREENCHER] E-mail, WhatsApp por país e número padrão, cidades.
- [PREENCHER] Faixas de faturamento por moeda (€, US$, R$).
- [PREENCHER] URL do webhook (FORM_WEBHOOK_URL), token do Pipedrive (opcional), ID do GTM (PUBLIC_GTM_ID), URL do Respondi.
- [PREENCHER] Razão social, número fiscal e endereço (páginas de Privacidade e Cookies, com revisão jurídica pendente).
- [Opcional] Número de vagas por trimestre no CTA final, só se for real (`cta.slots` nos arquivos de texto).
- [PREENCHER] Prazo de conservação das candidaturas e ferramentas de automação/CRM usadas (Política de privacidade).
- [PREENCHER] E-mail de privacidade.
- Revisão jurídica das páginas de Privacidade e Cookies.
