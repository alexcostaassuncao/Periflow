import React from 'react';
import { CalendarDays, CheckSquare, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getClientContract(client, contracts) {
  return contracts.find(contract =>
    contract.status === 'ativo' && (
      contract.client_id === client.id ||
      (!contract.client_id && contract.client_name?.trim().toLowerCase() === client.name?.trim().toLowerCase())
    )
  );
}

function Metric({ icon: Icon, label, completed, total }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#ff5000]/10 text-[#ff5000]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{completed} / {total}</p>
        <p className="text-xs text-gray-500">{completed} concluídas</p>
      </div>
    </div>
  );
}

export default function ClientPlansView({
  areaLabel,
  clients,
  selectedClient,
  onSelectClient,
  contracts,
  plans,
  tasks,
  month,
  onMonthChange,
  onCreateTask,
  onBrowseClients,
  onBrowsePlans,
  onOpenTask,
}) {
  const contract = selectedClient ? getClientContract(selectedClient, contracts) : null;
  const plan = plans.find(item => item.id === contract?.plan_id);
  const deliverables = plan?.deliverables || {};
  const designPieces = Number(deliverables.design_pieces) || 0;
  const artsLimit = designPieces || (Number(deliverables.posts) || 0) + (Number(deliverables.stories) || 0);
  const videosLimit = Number(deliverables.videos ?? deliverables.reels ?? 0);
  const monthTasks = selectedClient
    ? tasks.filter(task => task.client_id === selectedClient.id && task.due_date?.slice(0, 7) === month)
      .sort((left, right) => (left.due_date || '').localeCompare(right.due_date || ''))
    : [];
  const arts = monthTasks.filter(task => task.delivery_type === 'arte');
  const videos = monthTasks.filter(task => task.delivery_type === 'video');
  const completedArts = arts.filter(task => task.status === 'concluida').length;
  const completedVideos = videos.filter(task => task.status === 'concluida').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs text-gray-500">{areaLabel}{selectedClient ? ` / ${selectedClient.carteira?.toUpperCase() || 'Sem carteira'} / ${selectedClient.name}` : ''}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Clientes e planos</h1>
        </div>
        <Button onClick={onBrowseClients} className="gradient-primary shrink-0">
          + Cadastrar cliente
        </Button>
      </div>

      {clients.length > 0 && (
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Clientes da carteira">
          {clients.map(client => (
            <button
              key={client.id}
              type="button"
              role="tab"
              aria-selected={selectedClient?.id === client.id}
              onClick={() => onSelectClient(client.id)}
              className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                selectedClient?.id === client.id
                  ? 'border-[#ff5000] bg-[#ff5000] text-white'
                  : 'border-white/10 bg-[#12121a] text-gray-300 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {client.name}
            </button>
          ))}
        </div>
      )}

      {!selectedClient ? (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-white/10 bg-[#12121a] p-8 text-center">
          <div>
            <CheckSquare className="mx-auto mb-3 h-8 w-8 text-gray-500" />
            <p className="font-medium">Nenhum cliente nesta área e carteira</p>
            <p className="mt-1 text-sm text-gray-500">Cadastre um cliente para organizar as tarefas por plano.</p>
            <Button onClick={onBrowseClients} className="gradient-primary mt-4">Cadastrar cliente</Button>
          </div>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-white/10 bg-[#12121a] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedClient.name}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {plan?.name || (contract ? 'Contrato ativo sem plano associado' : 'Nenhum plano ativo vinculado')}
                </p>
              </div>
              <label className="flex shrink-0 flex-col gap-1 text-xs text-gray-400">
                Mês de referência
                <span className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="month"
                    value={month}
                    onChange={event => onMonthChange(event.target.value)}
                    className="h-10 rounded-lg border border-white/10 bg-[#1a1a2e] pl-9 pr-3 text-sm text-white"
                  />
                </span>
              </label>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-8">
              <Metric icon={Image} label="Artes do plano" completed={completedArts} total={artsLimit} />
              <Metric icon={Video} label="Vídeos do plano" completed={completedVideos} total={videosLimit} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => onCreateTask(selectedClient, plan)} className="gradient-primary">
                Criar tarefa
              </Button>
              <Button onClick={onBrowsePlans} variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/5">
                Ver planos e contratos
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Tarefas do mês</h2>
              <span className="text-xs text-gray-500">{monthTasks.length} tarefas</span>
            </div>
            {monthTasks.length === 0 ? (
              <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-white/10 bg-[#12121a] p-6 text-center text-gray-500">
                <div>
                  <CheckSquare className="mx-auto mb-3 h-7 w-7" />
                  <p className="text-sm">Nenhuma tarefa para este cliente neste mês.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {monthTasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpenTask(task)}
                    className="flex w-full items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#12121a] px-4 py-3 text-left hover:border-white/20"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{task.title}</span>
                      <span className="mt-1 block text-xs text-gray-500">{task.due_date || 'Sem prazo'} · {task.delivery_type === 'video' ? 'Vídeo' : task.delivery_type === 'arte' ? 'Arte' : 'Tarefa'}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${task.status === 'concluida' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-400'}`}>
                      {task.status === 'concluida' ? 'Concluída' : 'Em aberto'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
