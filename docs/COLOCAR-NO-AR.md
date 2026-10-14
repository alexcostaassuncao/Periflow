# Colocar o Periflow no ar (Vercel + Turso + Cloudinary)

O sistema não depende mais do ChatGPT Sites. Ele roda na **Vercel**, guarda os dados no **Turso** e as imagens e vídeos no **Cloudinary**. O login é próprio: email e senha.

Faça os passos **nesta ordem**. O passo 1 precisa acontecer enquanto o site antigo ainda está no ar.

---

## 1. Exportar os dados do site antigo

1. Abra `https://periferica-connect.alexcostaa.chatgpt.site/connect.html` (já logado).
2. Aperte **F12** e vá na aba **Console**.
3. Abra o arquivo `scripts/exportar-do-site-antigo.js`, copie **todo** o conteúdo, cole no Console e aperte Enter.
   Se o navegador bloquear a colagem, digite `allow pasting`, aperte Enter e cole de novo.
4. Espere a mensagem **"✔ Exportação concluída"**. O arquivo `periflow-export.json` será baixado.

Guarde esse arquivo com cuidado, porque ele tem todos os dados reais. Ele **não** vai para o GitHub.

> As senhas dos funcionários e as conexões do Instagram não podem ser exportadas.
> Você vai redefinir as senhas (passo 6) e reconectar o Instagram (passo 7).

## 2. Criar o banco no Turso

1. Crie uma conta em **https://turso.tech** (o plano gratuito basta).
2. Crie um banco chamado `periflow` e escolha a região **São Paulo** (ou a mais próxima).
3. No banco criado, copie:
   - a **URL** (começa com `libsql://...`) → `TURSO_DATABASE_URL`
   - um **token** novo (botão "Create Token") → `TURSO_AUTH_TOKEN`
4. Cole os dois no arquivo `.env.local` do projeto.

As tabelas são criadas sozinhas no primeiro deploy.

## 3. Preencher o `.env.local`

O arquivo `.env.local` (na pasta do projeto, fora do GitHub) já tem as chaves secretas geradas. Complete:

| Variável | O que colocar |
|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seu login de administrador. Use uma senha forte. |
| `CLOUDINARY_*` | Os mesmos valores do arquivo `.env` antigo. |
| `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` | Os mesmos valores do `.env` antigo. |
| `SITE_URL` | Deixe vazio por enquanto (passo 4). |

## 4. Criar o projeto na Vercel

1. Na tela **New Project**, importe o repositório `alexcostaassuncao/Periflow`.
2. Em **Application Preset**, escolha **Next.js**. Não use "Services": as outras pastas listadas são cópias antigas.
3. Deixe **Root Directory** como `./`.
4. Abra **Environment Variables** e cadastre **todas** as variáveis do `.env.local`, com os mesmos nomes e valores (exceto `SITE_URL`, que ainda está vazia).
   Dica: dá para colar o conteúdo inteiro do `.env.local` de uma vez no primeiro campo.
5. Clique em **Deploy**.
6. Quando terminar, copie o endereço do site (por exemplo `https://periflow.vercel.app`).
   - Na Vercel: **Settings → Environment Variables**, crie `SITE_URL` com esse endereço, **sem barra no final**.
   - Em **Deployments**, clique em **⋯ → Redeploy**.

## 5. Importar os dados no banco novo

No computador, com o VS Code **fechado**:

1. Apague a pasta `node_modules` do projeto. Ela ainda é a do sistema antigo e não funciona com o novo.
2. Abra o terminal na pasta do projeto e rode:

```
npm install
npm run db:import -- "C:\caminho\para\periflow-export.json"
```

O importador envia as mídias antigas ao Cloudinary, corrige os links e grava clientes, tarefas, módulos, permissões e funcionários no Turso.

## 6. Primeiro acesso

1. Abra o endereço da Vercel e entre com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
2. Em **Cadastros → Usuários e funcionários**, abra cada funcionário e defina uma senha.
   Cada um entra com o próprio email e essa senha.
   - Funcionários com acesso **Administrador** veem tudo.
   - Os demais usam a Gestão (clientes e tarefas), mas não acessam Cadastros, Acessos e Publicação.
3. O botão **Sair** fica no canto superior direito.

## 7. Instagram

1. No painel da Meta (app do Instagram), em **URIs de redirecionamento OAuth válidos**, troque o endereço antigo por:
   `SEU_SITE_URL/api/instagram/callback`
   O endereço exato aparece em **Cadastros → Contas / Acessos → Configuração do Instagram no Meta**.
2. Em **Cadastros → Contas / Acessos**, clique em **Conectar Instagram** para cada cliente.

## 8. Publicações agendadas

O agendamento é processado de hora em hora pelo GitHub (o plano gratuito da Vercel não permite tarefas a cada hora).

1. No GitHub: **Periflow → Settings → Secrets and variables → Actions → New repository secret**.
2. Crie dois segredos:
   - `SITE_URL`: o endereço do site
   - `CRON_SECRET`: o mesmo valor do `.env.local`
3. Para testar: aba **Actions → Publicações agendadas → Run workflow**.

> O GitHub pode atrasar alguns minutos em horários de pico. Se o repositório ficar 60 dias sem nenhum commit, o GitHub pausa o agendamento. Basta reativá-lo na aba Actions.

---

## Rodar no computador (opcional)

```
npm install
npm run dev
```

Abra `http://localhost:3000`. Sem `TURSO_DATABASE_URL`, o sistema usa um banco local (`periflow-local.db`), sem mexer nos dados reais.

## Limites a conhecer

- **Tamanho dos arquivos:** o Cloudinary gratuito aceita imagens de até 10 MB e vídeos de até 100 MB. O sistema limita a 30 MB.
- **Links das mídias:** as referências passam a ficar no Cloudinary, com links públicos difíceis de adivinhar. Antes elas eram privadas no site.
- **Esqueceu a senha de admin?** Troque `ADMIN_PASSWORD` na Vercel e faça Redeploy.
