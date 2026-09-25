# Revisão final pelos critérios de aceite

Build de produção (sem exemplos), testado localmente em 25.09.2026. As imagens desta pasta são as provas visuais.

| Critério | Resultado | Como foi verificado |
|---|---|---|
| Em 5 segundos, no celular, fica claro: arquitetura, performance, botão | Ok | Aos 0,5 s o carimbo e o botão já estão na tela. Aos 1,5 s a planta está desenhada. Aos 3 s os ambientes do funil estão nomeados. Ver `01-cinco-segundos-celular.png`. |
| Lighthouse no celular dentro do orçamento | Ok | Ver a tabela "Lighthouse no celular" abaixo. |
| LCP < 2,5 s, CLS < 0,1, INP < 200 ms | Ok | LCP de 1,7 a 1,8 s no 4G simulado do Lighthouse e CLS 0. Maior interação, com a CPU 4x mais lenta: 136 ms (abrir o índice). Antes do ajuste desta etapa eram 224 ms. |
| JavaScript da home até 150 KB comprimido | Ok | Cerca de 71 KB (gzip). O formulário carrega cerca de 8 KB. |
| Sem rolagem horizontal em 360, 390, 768, 1024, 1440 e 1920 px | Ok | 13 páginas nos três idiomas (home, formulário, privacidade, cookies e 404), em cada largura. |
| Safari do iPhone e navegador do Instagram | Ok em simulação; falta o aparelho real | Com o user agent do Instagram no iPhone, a barra de endereço simulada a aparecer e a sumir não moveu a página nem redesenhou a planta. O formulário completo funcionou. O motor do Safari (WebKit) não está disponível neste ambiente. Teste no iPhone e no Instagram: `docs/PUBLICAR.md`, Passo 6. |
| Movimento reduzido: tudo legível e estático | Ok | Nenhum texto escondido, sem scroll suave, todas as folhas no estado final. Ver `03-movimento-reduzido-celular.png`. |
| Teclado, foco visível, contraste AA | Ok | Tab percorre todas as páginas com o foco sempre visível e na tela. O índice prende o foco, e o Esc fecha e devolve o foco ao botão. O axe (WCAG 2.1 AA) encontrou zero violações em 14 páginas, no celular e no desktop. |
| Formulário chega ao webhook, leva ao WhatsApp mesmo com falha, eventos certos no dataLayer | Ok | Com o webhook no ar, a candidatura chega com UTMs, IDs de clique, primeiro e último toque e prioridade. Com o webhook fora do ar, a tela final e o WhatsApp aparecem e a falha é registrada. Log completo em `teste-envio.json`. |
| Três idiomas com hreflang corretos | Ok | 12 páginas com pt, en-US, es-ES e x-default, todas recíprocas, com canonical próprio. |
| Nenhum U+2014, U+2013 ou palavra proibida | Ok | `npm run check:copy` nos arquivos de conteúdo e `npm run check:launch` no HTML final. |
| Nenhum dado de exemplo visível no build de produção | Ok | Nenhuma marca EXEMPLO. As folhas Resultados e Palavra de cliente somem até haver itens publicados, e a numeração passa a F.01 a F.06. Ver `04-folhas-producao-desktop.png`. |
| Zero erros no console | Ok | 14 páginas, celular e desktop, com e sem movimento reduzido, percorridas até o fim. Na 404, o navegador registra o próprio código 404 da página, que é o comportamento certo. |

## Lighthouse no celular

| Página | Desempenho | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| Home (pt, en, es) | 99 | 100 | 100 | 100 |
| Formulário | 100 | 100 | 100 | 100 |
| Páginas legais | 100 | 100 | 100 | 66 |

- **Páginas legais:** o SEO 66 é intencional. Elas ficam fora do Google enquanto tiverem `[PREENCHER]` e passam a 100 sozinhas quando forem preenchidas.
- **Home:** a primeira medição com a máquina de teste parada dá 77. Medindo outra página antes, a home dá 99 logo na primeira vez, o que confirma que o 77 vem da máquina e não do site. Depois de publicar, a medição que vale é a do PageSpeed Insights no endereço real.

## Ajustes feitos nesta revisão

- **Índice:** abre um quadro depois do toque. A resposta ao toque passou de 224 ms para cerca de 130 ms com a CPU lenta.
- **Barra "Iniciar projeto" do celular:** ao esconder, marcava `aria-hidden` vazio, que os leitores de tela ignoram. Agora fica escondida de verdade, dentro de uma região própria.
- **Placeholder do e-mail:** trocado para `[PREENCHER: e-mail comercial]`, sem a palavra "contato".
- **Mensagem do WhatsApp:** "Olá, sou Nome (@atelier). Acabei de enviar a candidatura pelo site.", aprovada.
- **Verificação de lançamento:** novo comando `npm run check:launch`, que lista página a página o que ainda está por preencher.
- **Capturas de revisão:** agora são tiradas com o navegador no idioma da página, que é o que o visitante vê.
