import React from 'react';
import { StatCard, SectionCard, SimpleBarChart, SimplePieChart, fmtMoney } from './RelatorioUtils';
import { Users, CheckCircle2, Package, Building2, DollarSign, TrendingUp, Activity, Briefcase } from 'lucide-react';

const STATUS_LABELS = {
  prospeccao: 'Prospecção', reuniao_marcada: 'Reunião', contrato: 'Contrato',
  onboarding: 'Onboarding', cliente_ativo: 'Cliente Ativo', cancelado: 'Cancelado',
};

export default function RelatorioVisaoGeral({ leads, tasks, employees, clients, items }) {
  const leadAtivos = leads.filter(l => l.status === 'cliente_ativo').length;
  const taxaConversao = leads.length > 0 ? ((leadAtivos / leads.length) * 100).toFixed(1) : 0;
  const valorMensal = leads.filter(l => l.status === 'cliente_ativo').reduce((a, l) => a + (l.dados_contrato?.valor_mensal || 0), 0);
  const tarefasConcluidas = tasks.filter(t => t.status === 'concluida').length;
  const tarefasAtrasadas = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'concluida').length;
  const funcionariosAtivos = employees.filter(e => e.employee_status === 'ativo').length;
  const clientesAtivos = clients.filter(c => c.status === 'ativo').length;
  const itensEstoque = items.filter(i => i.status === 'ativo').length;

  const funnelData = Object.entries(
    leads.reduce((acc, l) => { acc[STATUS_LABELS[l.status] || l.status] = (acc[STATUS_LABELS[l.status] || l.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const taskStatusData = [
    { name: 'Concluídas', value: tarefasConcluidas },
    { name: 'Em Andamento', value: tasks.filter(t => t.status === 'em_andamento').length },
    { name: 'Pendentes', value: tasks.filter(t => t.status === 'a_fazer').length },
    { name: 'Atrasadas', value: tarefasAtrasadas },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-5">
      {/* KPIs gerais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Funcionários Ativos" value={funcionariosAtivos} color="text-blue-400" delay={0} />
        <StatCard icon={Building2} label="Clientes Ativos" value={clientesAtivos} color="text-green-400" delay={0.05} />
        <StatCard icon={CheckCircle2} label="Tarefas Concluídas" value={tarefasConcluidas} color="text-[#ff5000]" delay={0.1} />
        <StatCard icon={Activity} label="Tarefas Atrasadas" value={tarefasAtrasadas} color="text-red-400" delay={0.15} />
        <StatCard icon={TrendingUp} label="Leads CRM" value={leads.length} color="text-purple-400" delay={0.2} />
        <StatCard icon={Briefcase} label="Taxa Conversão" value={`${taxaConversao}%`} color="text-[#ff5000]" delay={0.25} />
        <StatCard icon={DollarSign} label="Recorrência Mensal" value={fmtMoney(valorMensal)} color="text-green-400" delay={0.3} />
        <StatCard icon={Package} label="Itens Estoque" value={itensEstoque} color="text-yellow-400" delay={0.35} />
      </div>

      {/* Gráficos resumidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Funil CRM por Etapa">
          <SimpleBarChart data={funnelData} xKey="name" yKey="value" label="Leads" />
        </SectionCard>
        <SectionCard title="Status das Tarefas">
          <SimplePieChart data={taskStatusData} />
        </SectionCard>
      </div>

      {/* Resumo em cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h4 className="font-semibold text-gray-300 mb-3">CRM — Resumo</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Prospecções</span><span>{leads.filter(l => l.status === 'prospeccao').length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Reuniões</span><span>{leads.filter(l => l.status === 'reuniao_marcada').length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Contratos</span><span>{leads.filter(l => l.status === 'contrato').length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Clientes Ativos</span><span className="text-green-400 font-bold">{leadAtivos}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cancelados</span><span className="text-red-400">{leads.filter(l => l.status === 'cancelado').length}</span></div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <h4 className="font-semibold text-gray-300 mb-3">Produtividade — Resumo</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total Tarefas</span><span>{tasks.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Concluídas</span><span className="text-green-400 font-bold">{tarefasConcluidas}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Em Andamento</span><span className="text-[#ff5000]">{tasks.filter(t => t.status === 'em_andamento').length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Em Revisão</span><span className="text-purple-400">{tasks.filter(t => t.status === 'em_revisao').length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Atrasadas</span><span className="text-red-400 font-bold">{tarefasAtrasadas}</span></div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <h4 className="font-semibold text-gray-300 mb-3">Equipe & Estoque — Resumo</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Funcionários</span><span>{employees.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Ativos</span><span className="text-green-400">{funcionariosAtivos}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Clientes Cadastrados</span><span>{clients.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Itens no Estoque</span><span>{itensEstoque}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Em Manutenção</span><span className="text-yellow-400">{items.filter(i => i.localizacao === 'manutencao').length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}