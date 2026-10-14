import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  StatCard, SectionCard, DataTable, SimplePieChart, SimpleBarChart,
  SimpleLineChart, EmptyMsg, fmtMoney, exportPDF
} from './RelatorioUtils';
import {
  Users, Calendar, FileText, CheckCircle2, XCircle, DollarSign, TrendingUp
} from 'lucide-react';

const STATUS_LABELS = {
  prospeccao: 'Prospecção', reuniao_marcada: 'Reunião', contrato: 'Contrato',
  onboarding: 'Onboarding', cliente_ativo: 'Cliente Ativo', cancelado: 'Cancelado',
};

export default function RelatorioVendasCRM({ leads }) {
  const [exporting, setExporting] = useState(false);

  const total = leads.length;
  const reunioes = leads.filter(l => ['reuniao_marcada', 'contrato', 'onboarding', 'cliente_ativo'].includes(l.status)).length;
  const contratos = leads.filter(l => ['contrato', 'onboarding', 'cliente_ativo'].includes(l.status)).length;
  const onboarding = leads.filter(l => l.status === 'onboarding').length;
  const cancelados = leads.filter(l => l.status === 'cancelado').length;
  const ativos = leads.filter(l => l.status === 'cliente_ativo').length;
  const taxaConversao = total > 0 ? ((ativos / total) * 100).toFixed(1) : 0;
  const valorTotal = leads.reduce((acc, l) => acc + (l.dados_contrato?.valor_entrada || 0), 0);
  const valorMensal = leads.filter(l => l.status === 'cliente_ativo').reduce((acc, l) => acc + (l.dados_contrato?.valor_mensal || 0), 0);

  const byStatus = Object.entries(
    leads.reduce((acc, l) => { acc[STATUS_LABELS[l.status] || l.status] = (acc[STATUS_LABELS[l.status] || l.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const byMonth = Object.entries(
    leads.reduce((acc, l) => {
      const m = l.created_date ? format(new Date(l.created_date), 'MM/yyyy') : 'N/A';
      acc[m] = (acc[m] || 0) + 1; return acc;
    }, {})
  ).sort((a, b) => a[0].localeCompare(b[0])).map(([mes, total]) => ({ mes, total }));

  const handleExport = async () => {
    setExporting(true);
    await exportPDF('Relatório Vendas e CRM', 'Período selecionado', 'relatorio-vendas-content');
    setExporting(false);
  };

  const columns = [
    { key: 'nome_contato', label: 'Contato' },
    { key: 'nome_empresa', label: 'Empresa' },
    { key: 'segmento', label: 'Segmento' },
    { key: 'status', label: 'Status', render: r => <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{STATUS_LABELS[r.status] || r.status}</span> },
    { key: 'responsavel_nome', label: 'Responsável' },
    { key: 'valor_mensal', label: 'Valor/mês', render: r => r.dados_contrato?.valor_mensal ? fmtMoney(r.dados_contrato.valor_mensal) : '—' },
    { key: 'created_date', label: 'Criado em', render: r => r.created_date ? format(new Date(r.created_date), 'dd/MM/yyyy') : '—' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={exporting} size="sm" className="bg-[#ff5000] hover:bg-[#cc4000] text-white">
          <Download className="w-4 h-4 mr-2" />{exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>
      <div id="relatorio-vendas-content" className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Prospecções" value={total} color="text-blue-400" delay={0} />
          <StatCard icon={Calendar} label="Reuniões" value={reunioes} color="text-purple-400" delay={0.05} />
          <StatCard icon={FileText} label="Contratos" value={contratos} color="text-[#ff5000]" delay={0.1} />
          <StatCard icon={CheckCircle2} label="Clientes Ativos" value={ativos} color="text-green-400" delay={0.15} />
          <StatCard icon={XCircle} label="Cancelados" value={cancelados} color="text-red-400" delay={0.2} />
          <StatCard icon={TrendingUp} label="Taxa Conversão" value={`${taxaConversao}%`} color="text-[#ff5000]" delay={0.25} />
          <StatCard icon={Users} label="Em Onboarding" value={onboarding} color="text-yellow-400" delay={0.3} />
          <StatCard icon={DollarSign} label="Valor Entradas" value={fmtMoney(valorTotal)} color="text-green-400" delay={0.35} />
          <StatCard icon={DollarSign} label="Recorrência Mensal" value={fmtMoney(valorMensal)} color="text-[#ff5000]" delay={0.4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Leads por Etapa do Funil">
            <SimpleBarChart data={byStatus} xKey="name" yKey="value" label="Leads" />
          </SectionCard>
          <SectionCard title="Distribuição por Status">
            <SimplePieChart data={byStatus} />
          </SectionCard>
          <SectionCard title="Evolução de Leads por Mês">
            <SimpleLineChart data={byMonth} xKey="mes" yKey="total" label="Leads" />
          </SectionCard>
        </div>
        <SectionCard title="Todos os Leads">
          <DataTable columns={columns} rows={leads} />
        </SectionCard>
      </div>
    </div>
  );
}