# Hub Performance · regras permanentes do site

Site da Hub Performance: agência de aquisição de clientes e processo comercial exclusiva para arquitetos e designers de interiores. O site tem um único trabalho: converter visita em candidatura qualificada. Toda decisão de design, animação e texto responde a isso.

Público: arquitetos e designers de interiores com atelier próprio, 30 a 55 anos. A maior parte chega por anúncio no Instagram, no celular, dentro do navegador interno do Instagram, muitas vezes em 4G. O celular converte; o desktop brilha.

## Conceito: a planta comercial

- O site é um conjunto de folhas de projeto numeradas (F.01 a F.08). A numeração é calculada a partir das folhas visíveis (`numberSheets` em `src/lib/content.ts`).
- Hero: uma planta baixa cujos ambientes são as etapas do funil. No scroll ela vira axonometria e as paredes sobem.
- 90 dias seguem as fases de um projeto de arquitetura. Lista de entregas é a "memória descritiva". Rodapé é o carimbo.
- A metáfora mora nos detalhes (rótulos em mono, linhas, cotas, carimbo), nunca nos títulos. Títulos são claros e diretos. Se a metáfora atrapalhar a compreensão, ela sai.

## Copy (vale para sempre, nos três idiomas)

- Tom formal, direto, confiante, com provocação na medida. Frases curtas, zero enchimento.
- Proibido: travessão (U+2014), meia-risca (U+2013), hífen duplo e hífen solto no meio da frase fazendo papel de travessão. Use vírgula, ponto, dois-pontos ou parênteses.
- Palavras proibidas (PT): "sistema", "máquina", "a gente", "transformar espaços", "casa dos sonhos", "alavancar", "potencializar", "próximo nível", "soluções", "inovador", "jornada", "desbloquear", "no mundo de hoje" e construções do tipo "não é só X, é Y". Em EN e ES, os equivalentes.
- Português neutro (Portugal e Brasil): sem "você" e sem "tu" (use "o seu atelier", impessoal ou infinitivo) e sem palavras que mudam entre os países (contato/contacto, equipe/equipa, celular/telemóvel, registro/registo, conosco/connosco, arquivo/ficheiro, tela/ecrã).
- Inglês americano. Espanhol da Espanha, tratando por tú. Adaptação, não tradução literal.
- Nada de número, depoimento, logo, prêmio ou resultado inventado. O que não existe vira `[PREENCHER: o que é]`.
- Glossário: Folha = Sheet / Lámina; Planta = Floor plan / Planta; Carimbo = Title block / Cajetín; Cota = Dimension line / Cota; Memória descritiva = Specifications / Memoria descriptiva; Responsável técnico = Project lead / Responsable técnico; Circulação / follow-up = Circulation / follow-up / Circulación / seguimiento; Fases = Survey, Concept, Technical design, Construction, Handover / Levantamiento, Anteproyecto, Proyecto de ejecución, Obra, Entrega; Iniciar projeto = Start your project / Iniciar proyecto; Atelier = Studio / Estudio.
- Verificação automática: `npm run check:copy` (deve passar antes de cada commit).

## Conteúdo

- Todo texto fica em arquivos por idioma em `src/content/` (YAML). Nada de texto solto em componente.
- Configurações (WhatsApp por país, e-mail, redes, cidades, modo do formulário, URL do Respondi, faixas de faturamento) em `src/config/site.ts`.
- Cases (`src/content/cases/*.yaml`) e depoimentos (`src/content/depoimentos/*.yaml`): um arquivo por item, com blocos `pt`/`en`/`es` para os textos e números uma vez só. Campo `publicado`: em desenvolvimento, os não publicados aparecem com marca d'água "EXEMPLO"; em produção, somem. Sem nenhum publicado, a folha e o item do índice somem e a numeração se ajusta (`src/components/Home.astro`).
- Placeholders sempre no formato `[PREENCHER: o que é]`.
- Formulário (`src/content/form/*.yaml`): validação única em `src/lib/lead.ts`, usada no navegador (`src/scripts/lead-form.ts`) e no servidor (`src/pages/api/lead.ts`). O envio nunca bloqueia a tela final. Na última pergunta não há avanço automático: o botão e a nota de privacidade ficam à vista.
- Páginas legais em `src/content/legal/{pt,en,es}/*.md`. Com `[PREENCHER]`, ficam noindex e fora do sitemap.
- Textos compartilhados (nota de cookies, sugestão de idioma, rótulos legais) em `src/content/common/*.yaml`.

## Direção de arte

- Tokens em `src/styles/tokens.css`. Nunca use cor, fonte, curva ou medida fora deles.
- Cores: papel `#F3F1EC` (fundo), grafite `#121211` (texto e fundos escuros), concreto `#6E6C66` (secundário sobre papel), pedra `#9B9890` (secundário sobre grafite), linha = grafite a 13% (sobre grafite, papel a 13%), sinal `#FF4F00`.
- Cor sinal = "a construir": só no que se move, cresce ou vai ser construído (leads, progresso, estados ativos). No máximo uns 5% de qualquer tela. Sobre papel, nunca em texto (só pontos, linhas, preenchimentos). Sobre grafite pode aparecer em números grandes.
- Tipografia: Geist (texto e títulos) e Geist Mono (rótulos, números, anotações), auto-hospedadas em `public/fonts`, subsets latin e latin-ext, latin pré-carregado. Pesos regular e médio. Títulos grandes, entrelinha curta, espaçamento negativo. Rótulos em mono, pequenos, caixa alta, espaçamento aberto ("F.03 · MÉTODO"). Números tabulares.
- Grelha: 12 colunas no desktop (a partir de 768 px), 4 no celular. Fios de 1 px. Texto corrido com no máximo 60 caracteres por linha.
- Proibido: estética de terminal, HUD, cyberpunk, glitch; gradientes, glassmorphism, neon, blobs, 3D de brinquedo; grade de cards com ícone, foto de banco, emoji, ilustração de pessoas; kits de UI (shadcn, Bootstrap, templates); preloader; scroll sequestrado no celular; cursor que esconde o cursor real; botão pílula com sombra.

## Movimento

- Movimento é desenho: linhas se desenham, blocos se revelam por máscara, números contam. Nada quica, balança ou gira à toa. Toda animação tem função.
- Uma curva só para transições: expo out (`EASE` em `src/scripts/motion.ts`, `--ease` no CSS), 0,6 a 1,2 s. Animações ligadas ao scroll seguem o scroll.
- No DOM, anime só `transform`, `opacity` e traço de SVG. A planta do hero é Canvas 2D redesenhado em requestAnimationFrame e pausa fora da tela.
- `prefers-reduced-motion`: tudo no estado final, sem smooth scroll. A classe `motion` no `<html>` só existe quando o movimento é permitido.
- Lenis só com mouse. `ScrollTrigger.config({ ignoreMobileResize: true })` e unidades `svh`/`dvh`, para os trechos fixos não pularem no navegador do Instagram.

## Stack

- Astro 7 + TypeScript, CSS próprio com tokens e estilos com escopo. Sem Tailwind.
- GSAP (ScrollTrigger, SplitText, DrawSVG), Lenis. Sem WebGL e sem Three.js.
- Adapter da Vercel; o endpoint do formulário é serverless (`prerender = false`). Por isso `astro preview` não serve o build: para medir, sirva `.vercel/output/static`.
- Medição só por dataLayer (`src/scripts/track.ts`), GTM carregado depois da página. Consent Mode v2 negado por padrão no `<head>` de `src/layouts/Base.astro`. Origem da visita em `src/scripts/attribution.ts` (entre visitas só com consentimento).
- Cada folha usa `src/components/Sheet.astro` (rótulo, título, apoio) e fica em `src/components/sheets/`. Linhas que abrem (Serviços, Perguntas): `Row.astro` + `src/scripts/rows.ts`.
- Revelações: `data-reveal="lines"` (máscara por linha), `data-reveal="fade"`, `data-reveal-item` (itens de lista). JS das folhas em `src/scripts/sections.ts`, carregado à parte depois do hero.
- Folhas escuras (`dark` no `Sheet`): fundo grafite próprio; a camada `[data-dark-layer]` escurece a página na aproximação e a classe `on-dark` no `<html>` inverte a barra, o indicador e o CTA do celular.
- Planta do hero: dados em `src/data/plan.ts` (paisagem e retrato), geometria em `src/lib/plan/geometry.ts`, projeção em `src/lib/plan/camera.ts`, desenho em `src/lib/plan/renderer.ts`, leads em `src/lib/plan/leads.ts`, orquestração em `src/scripts/hero.ts`. Nunca desenhe a planta à mão em SVG: mude os dados.

## Orçamento de performance

- Lighthouse no celular: Performance 90+, Acessibilidade 95+, Boas práticas 100, SEO 100.
- LCP < 2,5 s em 4G, CLS < 0,1, INP < 200 ms. JavaScript da home até 150 KB comprimido.
- Imagens em AVIF ou WebP, com tamanhos responsivos e lazy load. O H1 (no carimbo) é o LCP: não animar a entrada dele.

## Comandos

```
npm install          instala dependências
npm run dev          servidor local em http://localhost:4321
npm run build        build de produção (pasta dist/ e .vercel/)
npm run preview      serve o build
npm run check        tipos (astro check) e regras de copy
npm run check:copy   só as regras de copy
npm run shots        screenshots do hero (390x844 e 1440x900) em screenshots/latest
npm run shots:sheets screenshots de todas as folhas, índice, grelha e 404 em screenshots/sheets
npm run og           imagens de partilha (public/og) a partir do hero, com PUBLIC_DRAFTS=off npm run dev rodando
```

## Modo de trabalho

- Trabalho em etapas; no fim de cada uma, parar, mostrar e esperar aprovação. Se algo do briefing ficar feio na prática, propor a alternativa antes de mudar.
- Antes de entregar qualquer etapa: rodar o site, tirar screenshots em 390x844 e 1440x900 (`npm run shots` e `npm run shots:sheets`), olhar, corrigir o que estiver desalinhado, apertado ou com cara de template.
- SplitText: não usar `tag: 'span'` (linhas ficam inline e a máscara deixa de funcionar).
- Commit ao fim de cada etapa.
