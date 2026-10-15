# Aba Projetos (antigo GestãoPro)

O GestãoPro, que rodava no WordPress com Firebase, agora é a aba **📁 Projetos** do Periflow. Ele usa o login, os funcionários e o banco Turso do Periflow.

| Arquivo | Conteúdo |
|---|---|
| `public/projetos.html` | Tela (dashboard, projetos, prontuário/notas, empresas, acessos) |
| `app/api/projetos/route.ts` | API: carregar e salvar |
| `app/api/projetos/banners/route.ts` | Envio diário dos lembretes de banners por webhook |
| `db/projetos.ts` | Regras compartilhadas (permissões, lembretes) |
| `drizzle/0008_projetos.sql` | Tabelas `projetos`, `projeto_notas`, `projeto_empresas` |
| `.github/workflows/lembretes-banners.yml` | Agenda o envio dos lembretes às 09:00 (Brasília) |

## Permissões

Seguem o **nível de acesso** do cadastro de funcionários:

| Acesso no Periflow | Na aba Projetos |
|---|---|
| Administrador | Tudo, inclusive apagar todos os projetos na importação de planilha |
| Gestor / Produção | Cria e edita projetos, notas e empresas; vê as senhas de acesso |
| Somente leitura | Só consulta; senhas e webhooks aparecem ocultos |

## Trazer os dados do Firebase (uma vez)

1. Abra a página do GestãoPro no WordPress e entre com a conta de **administrador**.
2. Aperte **F12** → **Console**, cole o conteúdo de `scripts/exportar-gestaopro.js` e aperte Enter (se o navegador pedir, digite `allow pasting` antes).
3. O arquivo `gestaopro-export.json` é baixado. **Ele contém senhas de clientes**: guarde com cuidado e não envie ao GitHub (o `.gitignore` já o bloqueia).
4. No computador, com o `.env.local` apontando para o Turso de produção:
   ```
   npm run db:migrate
   npm run db:import-projetos -- caminho/para/gestaopro-export.json
   ```
5. O responsável de cada projeto é ligado ao funcionário do Periflow **com o mesmo email**. Quem não tiver cadastro continua aparecendo pelo nome; o script lista esses nomes no final.

O import pode ser repetido com uma exportação mais nova: os projetos e empresas vindos do Firebase são atualizados (a exportação mais recente vence) e as notas criadas no Periflow são mantidas. Faça a última exportação logo antes de desligar o WordPress.

## Depois de migrar

- **Desligue o envio automático no WordPress** (ou tire a página do ar). Enquanto os dois sistemas estiverem ativos, o GestãoPro antigo também dispara os webhooks de banners pelo navegador e as mensagens podem duplicar.
- O cron usa os mesmos segredos `SITE_URL` e `CRON_SECRET` do agendador de publicações. Nada a configurar além disso.
- Para testar o lembrete na hora: GitHub → Actions → *Lembretes de banners* → **Run workflow**.
