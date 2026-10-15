# Periflow

Gestão de clientes, produção e publicação no Instagram.

- **Hospedagem:** Vercel (Next.js)
- **Banco:** Turso (SQLite/libSQL). As tabelas ficam em `drizzle/*.sql` e são aplicadas por `scripts/db-migrate.mjs` a cada build.
- **Mídias:** Cloudinary, com upload direto do navegador e assinatura feita pelo servidor.
- **Login:** próprio, por email e senha. Todo o site é protegido por `proxy.ts`.

Passo a passo para colocar no ar: **[docs/COLOCAR-NO-AR.md](docs/COLOCAR-NO-AR.md)**.

## Desenvolvimento

```
npm install
npm run dev        # http://localhost:3000 (banco local periflow-local.db se não houver TURSO_DATABASE_URL)
```

Variáveis: veja `.env.example`. No computador, use `.env.local`.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `public/connect.html` + `public/*.js` | Interface do sistema |
| `public/login.html` | Tela de login |
| `app/api/*` | APIs (dados, usuários, mídias, Instagram, publicações) |
| `proxy.ts`, `lib/session.ts`, `lib/auth.ts` | Login e proteção das rotas |
| `db/raw.ts` | Conexão com o Turso |
| `scripts/` | Migrações, exportação do site antigo e importação de dados |
| `public/projetos.html`, `app/api/projetos/*` | Aba Projetos (antigo GestãoPro). Veja **[docs/ABA-PROJETOS.md](docs/ABA-PROJETOS.md)** |
