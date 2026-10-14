# Periférica Connect — checklist do fluxo

- [x] Cada arte e vídeo é uma tarefa independente, visível na lista do cliente.
- [x] Reunião mensal separada, com ata, briefing e vínculo às entregas; não consome cota de artes ou vídeos.
- [x] Quantidades variáveis, criação de várias entregas independentes e modelo mensal baseado no cadastro.
- [x] Conteúdo mensal: consultor → copy → produção → revisão do consultor → cliente → finalizado.
- [x] Campanha: consultor → copy → produção → revisão do consultor → tráfego → cliente → finalizado.
- [x] Ajustes descritos e enviados para copy, design, edição ou gravação; revisão antes de novo envio ao cliente.
- [x] Vídeos com gravação e edição separadas ou somente edição; data de gravação e editor selecionável.
- [x] Equipe configurável por carteira e por cliente, incluindo gestor de tráfego; sem atribuição automática à gerente.
- [x] Salvar em todas as abas, sem precisar preparar uma publicação; possibilidade de encaminhar após salvar.
- [x] Clique fora não fecha a edição; fechamento com alterações oferece salvar, descartar ou continuar.
- [x] Briefing separado de headline, subheadline, CTA, legenda, texto / roteiro e versão final da Criação.
- [x] Resumo da arte e trecho da legenda na lista; botão Abrir tarefa retirado das entregas ativas.
- [x] Publicar abre painel lateral com a tarefa disponível para consulta, formatos Post / Reels / Stories e opção agora / agendar / rascunho.
- [x] Publicação usa legenda e link da versão final salvos em Criação; alteração depois de agendar impede envio de uma versão desatualizada.
- [x] Quatro cotas no cadastro: mensal artes / vídeos e campanha artes / vídeos, com contadores separados por cliente e mês.
- [x] Exclusões e cancelamentos saem da contagem; reunião não conta; aprovado indica conclusão sem apagar histórico.
- [x] Filtros por carteira, cliente e responsável; campanhas dentro do cliente da carteira.
- [x] Cancelamento e duplicação confirmados; cancelada somente para consulta; exclusão usa endpoint persistente existente.

## Dependências existentes que este ajuste não simula

- A Meta precisa de um arquivo final HTTPS acessível sem login. O upload protegido da tarefa não se torna público automaticamente; informar o link final em Criação.
- A integração de postagem existente é Instagram. Facebook continua em preparação.
- Envio de código por email continua condicionado à configuração do serviço de email existente.
- Registros antigos dos módulos continuam armazenados; não foram apagados nem convertidos em novas tarefas automaticamente.

## Verificação

Teste de DOM isolado com respostas de API simuladas: carregamento, salvamento em Geral, criação de duas entregas, bloqueio de clique externo, encaminhamento mensal e ajuste de copy, rotas de campanha e vídeo, alinhamento do painel de publicação, manutenção dos campos após falha de salvamento e contadores zerados / cancelados. Verificação TypeScript e build do site. Nenhuma publicação real nas redes foi usada no teste.

## Simplificação solicitada em 05/10

- Geral: somente cliente, nome, tipo, prioridade, prazo e resumo. Categoria e mês são inferidos do contexto, sem solicitar preenchimento. Uma tarefa por criação. Campos adicionais de vídeo retirados do formulário.
- Criação: somente legenda, texto da imagem / roteiro e post final. Campos separados de headline, subheadline e CTA retirados; dados anteriores preservados.
- Link público disponível na Publicação. Briefing e fluxo lateral preservados.
- Salvar não exige responsável, quantidade ou mês preenchidos pelo usuário. Responsável continua selecionável no fluxo e obrigatório para encaminhar.

## Fluxo e publicação — correção visual

- Etapas do fluxo voltaram a ser botões clicáveis; a escolha é persistida ao salvar.
- Botões Encaminhar retirados dos cartões e do editor. Após salvar, uma única janela oferece continuar na etapa atual ou passar para a próxima, com responsável selecionável.
- Painel de publicação acima do editor, com fundo branco e controles acessíveis; editor e painel ficam lado a lado no desktop.

## Responsável por etapa

- O seletor separado de responsável foi retirado do topo.
- Cada etapa apresenta seu nome, inicial da pessoa e seletor de funcionário.
- O padrão vem da equipe do cliente/carteira; a troca feita numa tarefa é específica daquela etapa e tarefa.
- Alterar a pessoa de uma etapa futura não altera a etapa atual. Selecionar a etapa atual sincroniza responsável, filtros e lista. Salvar mantém todas as escolhas.
- A confirmação de próxima etapa usa o responsável configurado para essa etapa na tarefa.

## Conferência de permissões pelo Adm

- Oito perfis: Adm, Gestor/Consultor, Copy, Designer, Videomaker, Editor, Tráfego e Cliente.
- Matriz editável, abrangência e atribuição aos funcionários cadastrados, persistidas separadamente do cadastro e sem envio de emails.
- Consulta de permissão permitida/bloqueada executada no servidor pelo Adm, sem alterar dados reais.
- A tela explicita que é configuração e conferência: login individual e validação por email ainda não estão ativados. Não representa uma autorização de acesso externo ao site.

## Comercial, reuniões e relatórios
- CRM em funil: prospecção, reunião, proposta, negociação, fechamento, onboarding, cliente ativo e cancelamento.
- Reunião do lead salva junto do evento, com vínculo estável e sem duplicação nas edições.
- Calendário registra reunião agendada, realizada ou cancelada e observações de resultado.
- Proposta preparada a partir do lead, com contato preenchido e vínculo preservado; envio/aprovação atualizam o funil.
- Relatórios com dados persistidos, filtros de mês, cliente e pessoa e contagens separadas de reuniões, propostas, contratos e tarefas.
- Formulários dos módulos com campos principais e detalhes expansíveis, sem remover os dados dos JSON.
- Perfis: configuração e conferência pelo Adm. Login individual/validação de email pendentes.
- Publicação e servidor permanecem para a próxima etapa; nenhum envio social executado nestes testes.
