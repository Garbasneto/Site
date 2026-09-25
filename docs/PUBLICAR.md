# Publicar o site na Vercel e ligar o domínio

Guia passo a passo, sem precisar de programar. Leva uns 30 minutos, mais o tempo de o domínio "pegar" (de minutos a algumas horas).

Os nomes dos botões da Vercel podem mudar um pouco com o tempo. Se algum não bater, procure o mais parecido ou me mande um print.

---

## Antes de começar

Vai precisar de:

1. **A conta do GitHub** onde está o código: `garbasneto/site`.
2. **Acesso ao painel onde o domínio foi comprado** (Registro.br, GoDaddy, Hostinger, Namecheap, Cloudflare, etc.). É lá que se mudam os "registros DNS".
3. **Os dados que ainda faltam no site.** Para ver a lista, me peça "rode o check:launch". Hoje são 54 campos `[PREENCHER]`. Os mais importantes antes de abrir ao público:
   - números de WhatsApp (padrão e por país);
   - e-mail comercial;
   - faixas de faturamento em €, US$ e R$;
   - nome do fundador;
   - razão social, número fiscal, endereço e e-mail de privacidade (páginas legais).

Pode publicar antes disso num endereço provisório (`algo.vercel.app`) para testar. O domínio oficial só deve apontar para o site quando os `[PREENCHER]` estiverem preenchidos, porque eles aparecem na tela.

---

## Passo 1 · Criar a conta na Vercel

1. Abra **vercel.com/signup**.
2. Escolha **Continue with GitHub** e entre com a conta `garbasneto`.
3. **Plano:** a Vercel reserva o plano gratuito (Hobby) para uso pessoal e não comercial. Para o site da empresa, o indicado é o **Pro**. Confira o preço atual na página de planos antes de escolher.

## Passo 2 · Importar o projeto

1. No painel da Vercel, clique em **Add New…** e depois em **Project**.
2. Em **Import Git Repository**, a Vercel pede permissão para ver o GitHub. Autorize.
   - Se perguntar quais repositórios, escolha **Only select repositories** e marque **site**.
3. Ao lado de `garbasneto/site`, clique em **Import**.
4. Na tela de configuração:
   - **Framework Preset:** deve aparecer **Astro** sozinho. Se não aparecer, escolha Astro.
   - **Root Directory**, **Build Command** e **Output Directory:** não mexa.
5. Ainda nessa tela, abra **Environment Variables** e faça o Passo 3 antes de clicar em Deploy.

## Passo 3 · Variáveis (as "configurações secretas")

Adicione uma a uma (nome à esquerda, valor à direita):

| Nome | Valor | Precisa? |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://hubperformance.io` (o domínio final, sem barra no fim) | Sim |
| `FORM_WEBHOOK_URL` | O endereço do cenário no Make, n8n ou Zapier que recebe as candidaturas | Sim, para receber candidaturas |
| `PUBLIC_GTM_ID` | O ID do Google Tag Manager, no formato `GTM-XXXXXXX` | Para medir campanhas |
| `PIPEDRIVE_API_TOKEN` | O token da API do Pipedrive (em Pipedrive > Preferências pessoais > API) | Opcional |
| `FORM_MODE` | `native` (formulário do site) ou `external` (Respondi) | Opcional; sem ela, fica `native` |

**Atenção:**

- **Sem o `FORM_WEBHOOK_URL`:** as candidaturas ficam só nos registros da Vercel, que são apagados em pouco tempo (horas ou poucos dias, conforme o plano). Não abra o site ao público sem o webhook.
- **Mudou alguma variável depois?** Ela só vale depois de publicar de novo: **Deployments**, os três pontinhos da publicação mais recente e **Redeploy**.

## Passo 4 · Publicar

1. Clique em **Deploy** e espere a mensagem de sucesso (1 a 3 minutos).
2. A Vercel mostra um endereço provisório, tipo `site-xxxx.vercel.app`. Abra e confira se está tudo lá.

**Daqui para frente:** cada alteração que eu enviar para o GitHub é publicada sozinha, em poucos minutos. Se preferir aprovar antes de ir ao ar, me diga e eu organizo uma versão de pré-visualização separada.

## Passo 5 · Ligar o domínio

### Na Vercel

1. Abra o projeto e vá em **Settings** e depois em **Domains**.
2. Digite `hubperformance.io` e clique em **Add**.
3. Se a Vercel perguntar sobre o `www`, escolha a opção que **redireciona `www.hubperformance.io` para `hubperformance.io`**. O site usa o endereço sem `www` como principal.
4. A Vercel mostra um cartão com os registros que precisam ser criados. **Deixe essa página aberta:** os valores exatos estão ali.

### No painel onde o domínio foi comprado

Procure a área **DNS**, **Zona DNS** ou **Gerenciar DNS** e crie estes dois registros:

| Tipo | Nome (ou Host) | Valor (ou Aponta para) |
|---|---|---|
| **A** | `@` (em alguns painéis, fica vazio ou é o próprio domínio) | `76.76.21.21`, ou o número que aparecer no cartão da Vercel |
| **CNAME** | `www` | O valor que aparecer no cartão da Vercel (algo como `xxxxxxxx.vercel-dns-017.com`) |

Cuidados:

- **Registros antigos:** se já houver um registro **A**, **AAAA** ou **CNAME** para `@` ou `www` apontando para outro lugar (página de "domínio estacionado", site antigo), apague esse registro antigo.
- **E-mail:** não mexa em registros **MX** nem **TXT**, que cuidam do e-mail. Apagar esses derruba o e-mail.
- **TTL:** pode deixar o padrão.

### Esperar

- Volte à página **Domains** da Vercel. Quando os dois domínios mostrarem **Valid Configuration**, está ligado.
- O cadeado (https) é criado sozinho pela Vercel.
- Costuma levar de alguns minutos a poucas horas. Em casos raros, até 48 horas.

**Se o domínio final não for `hubperformance.io`:** troque o `PUBLIC_SITE_URL` no Passo 3, faça o Redeploy e me avise. Ele entra nos endereços oficiais das páginas, no sitemap e nas imagens de partilha.

## Passo 6 · Testes no celular de verdade (15 minutos)

Alguns pontos só se confirmam num aparelho real. Eu testei tudo em simulação; faltam estes:

1. **iPhone:** abra o site no Safari. A planta desenha, o carimbo aparece, o botão "Iniciar projeto" funciona.
2. **Dentro do Instagram:** mande o link para si mesmo por mensagem direta (ou coloque na bio) e abra por lá. Role a página inteira: nada deve pular quando a barra de cima ou de baixo aparece e some.
3. **Android:** abra no Chrome.
4. **Candidatura de teste:** preencha com os seus dados e confira:
   - se chegou ao Make, n8n ou Zapier (e ao Pipedrive, se ligado);
   - se o botão "Falar agora no WhatsApp" abre a conversa com o número certo do país;
   - se a mensagem já vem escrita.
5. **Cookies:** numa janela anônima, recuse os cookies; noutra, aceite. Nas duas, o site deve funcionar normalmente.
6. **Velocidade:** abra **pagespeed.web.dev**, cole o endereço do site e veja a aba **Celular**. A meta é 90 ou mais em Desempenho.

## Passo 7 · Google (depois de ligar o domínio)

1. **Google Search Console** (search.google.com/search-console):
   - adicione o domínio;
   - siga a verificação (normalmente, um registro **TXT** no mesmo painel de DNS);
   - em **Sitemaps**, envie `https://hubperformance.io/sitemap.xml`.
2. **Google Tag Manager:**
   - no contêiner do `PUBLIC_GTM_ID`, configure as tags (GA4, Meta, Google Ads) com o **modo de consentimento** ativado e publique o contêiner;
   - use **Visualizar** (Tag Assistant) para ver os eventos a chegar: `cta_click`, `form_start`, `form_step`, `generate_lead`, `whatsapp_click`, `language_change` e `consent_update`.
   - Se quiser, eu escrevo a lista de tags e acionadores para quem for configurar.

---

## Se algo der errado

- **Voltar à versão anterior:** na Vercel, abra **Deployments**. Nos três pontinhos de uma publicação que estava boa, escolha **Promote to Production** (ou **Instant Rollback**). O site volta em segundos.
- **Ver se uma candidatura falhou:** no projeto da Vercel, abra **Logs** e procure por `[lead]`. Quando o envio falha, a candidatura completa aparece ali.
- **Domínio sem ligar depois de um dia:**
  - confira se os valores no DNS são exatamente os do cartão da Vercel;
  - confira se não sobrou nenhum registro antigo para `@` ou `www`;
  - se não achar o problema, me mande um print das duas telas.
