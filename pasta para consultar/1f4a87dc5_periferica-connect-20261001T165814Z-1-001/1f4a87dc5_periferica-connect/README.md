# Periferica Connect

Aplicacao React executada localmente, sem servicos externos de autenticacao ou banco de dados.

## Executar

```bash
npm install
npm run dev
```

## Armazenamento

Os cadastros ficam no `localStorage` do navegador atual. Eles nao sao sincronizados entre navegadores ou computadores, e limpar os dados do navegador apaga o conteudo salvo. O modo local nao fornece contas, permissoes seguras entre usuarios ou recuperacao de senha.

Importacoes de planilhas devem ser fornecidas em CSV. Arquivos enviados pelo app tambem ficam locais no navegador.
