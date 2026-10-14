import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard, SectionCard, DataTable, SimpleBarChart, SimplePieChart, exportPDF } from './RelatorioUtils';
import { Layers, CheckCircle2, Clock, AlertTriangle, GitBranch } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABELS = {
  a_fazer: 'A Fazer', em_andamento: 'Em Andamento', em_revisao: 'Em Revisão',
  aguardando_aprovacao: 'Aguardando Aprovação', concluida: 'Concluída',
};

const PRIORITY_COLORS = { alta: 'text-red-400', media: 'text-yellow-400', baixa: 'text-green-400' };

// Fonte: SOMENTE tarefas internas do sistema
export default function RelatorioFluxoTrabalho({ tasks, mesSelecionado }) {
  const [exporting, setExporting] = useState(false);

  // Filtra tasks pelo mês selecionado (usa due_date ou created_date)
  const tasksDoMes = mesSelecionado
    ? tasks.filter(t => {
        const ref = t.due_date || t.created_date;
        if (!ref) return false;
        return ref.startsWith(mesSelecionado);
      })
    : tasks;

  const mesLabel = (() => {
    try { return format(new Date(mesSelecionado + '-01'), 'MMMM/yyyy', { locale: ptBR }); } catch { return mesSelecionado; }
  })();

  const total = tasksDoMes.length;
  const concluidas = tasksDoMes.filter(t => t.status === 'concluida').length;
  const emAndamento = tasksDoMes.filter(t => t.status === 'em_andamento').length;
  const atrasadas = tasksDoMes.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'concluida').length;
  const emRevisao = tasksDoMes.filter(t => t.status === 'em_revisao').length;

  const byStatus = Object.entries(
    tasksDoMes.reduce((acc, t) => { acc[STATUS_LABELS[t.status] || t.status] = (acc[STATUS_LABELS[t.status] || t.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const byPriority = [
    { name: 'Alta', value: tasksDoMes.filter(t => t.priority === 'alta').length },
    { name: 'Média', value: tasksDoMes.filter(t => t.priority === 'media').length },
    { name: 'Baixa', value: tasksDoMes.filter(t => t.priority === 'baixa').length },
  ];

  const byClient = Object.entries(
    tasksDoMes.reduce((acc, t) => { if (t.client_name) acc[t.client_name] = (acc[t.client_name] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  const columns = [
    { key: 'title', label: 'Tarefa' },
    { key: 'client_name', label: 'Cliente' },
    { key: 'responsible_email', label: 'Responsável' },
    { key: 'priority', label: 'Prioridade', render: r => (
      <span className={`font-semibold ${PRIORITY_COLORS[r.priority] || 'text-gray-400'}`}>{r.priority}</span>
    )},
    { key: 'status', label: 'Status', render: r => (
      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{STATUS_LABELS[r.status] || r.status}</span>
    )},
    { key: 'due_date', label: 'Vencimento', render: r => {
      if (!r.due_date) return '—';
      const overdue = new Date(r.due_date) < new Date() && r.status !== 'concluida';
      return <span className={overdue ? 'text-red-400' : ''}>{format(new Date(r.due_date), 'dd/MM/yyyy')}</span>;
    }},
  ];

  const handleExport = async () => {
    setExporting(true);
    await exportPDF(`Relatório Fluxo de Trabalho — ${mesLabel}`, mesLabel, 'relatorio-fluxo-content');
    setExporting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Fonte: Tarefas internas do sistema</p>
          <p className="text-sm text-gray-300">Competência: <span className="text-[#ff5000] font-semibold">{mesLabel}</span></p>
        </div>
        <Button onClick={handleExport} disabled={exporting} size="sm" className="bg-[#ff5000] hover:bg-[#cc4000] text-white">
          <Download className="w-4 h-4 mr-2" />{exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>
      {tasksDoMes.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center text-gray-500">
          <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhuma tarefa interna encontrada para <strong>{mesLabel}</strong>.</p>
        </div>
      )}
      {tasksDoMes.length > 0 && <div id="relatorio-fluxo-content" className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Layers} label="Total Tarefas" value={total} color="text-blue-400" delay={0} />
          <StatCard icon={Clock} label="Em Andamento" value={emAndamento} color="text-[#ff5000]" delay={0.05} />
          <StatCard icon={CheckCircle2} label="Concluídas" value={concluidas} color="text-green-400" delay={0.1} />
          <StatCard icon={AlertTriangle} label="Atrasadas" value={atrasadas} color="text-red-400" delay={0.15} />
          <StatCard icon={GitBranch} label="Em Revisão" value={emRevisao} color="text-purple-400" delay={0.2} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SectionCard title="Por Status">
            <SimplePieChart data={byStatus} />
          </SectionCard>
          <SectionCard title="Por Prioridade">
            <SimpleBarChart data={byPriority} xKey="name" yKey="value" label="Tarefas" />
          </SectionCard>
          <SectionCard title="Por Cliente (Top 10)">
            <SimpleBarChart data={byClient} xKey="name" yKey="value" label="Tarefas" />
          </SectionCard>
        </div>
        <SectionCard title="Todas as Tarefas">
          <DataTable columns={columns} rows={tasksDoMes} />
        </SectionCard>
      </div>}
    </div>
  );
}