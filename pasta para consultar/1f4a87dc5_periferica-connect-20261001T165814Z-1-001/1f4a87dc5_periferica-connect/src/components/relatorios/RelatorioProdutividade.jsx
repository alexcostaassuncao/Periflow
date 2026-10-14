import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard, SectionCard, DataTable, SimpleBarChart, SimplePieChart, EmptyMsg, exportPDF } from './RelatorioUtils';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Fonte: SOMENTE dados do eKyte/importações
export default function RelatorioProdutividade({ ekyteWorkspaces, mesSelecionado }) {
  const [exporting, setExporting] = useState(false);

  // Filtra apenas o mês selecionado
  const wsDoMes = ekyteWorkspaces.filter(w => w.mes_referencia === mesSelecionado);

  const totalNovas = wsDoMes.reduce((s, w) => s + (w.novas || 0), 0);
  const totalConcluidas = wsDoMes.reduce((s, w) => s + (w.concluidas || 0), 0);
  const totalAtrasaram = wsDoMes.reduce((s, w) => s + (w.atrasaram || 0), 0);
  const totalPendentes = Math.max(totalNovas - totalConcluidas, 0);
  const den = totalConcluidas + totalPendentes + totalAtrasaram;
  const pctGeral = den > 0 ? Math.round((totalConcluidas / den) * 100) : 0;

  // Por workspace (top 15 por concluídas)
  const byWorkspace = Object.values(
    wsDoMes.reduce((acc, w) => {
      if (!acc[w.workspace]) acc[w.workspace] = { name: w.workspace, concluidas: 0, novas: 0, atrasaram: 0 };
      acc[w.workspace].concluidas += w.concluidas || 0;
      acc[w.workspace].novas += w.novas || 0;
      acc[w.workspace].atrasaram += w.atrasaram || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.concluidas - a.concluidas).slice(0, 15);

  // Distribuição para pizza
  const pieData = [
    { name: 'Concluídas', value: totalConcluidas },
    { name: 'Pendentes', value: totalPendentes },
    { name: 'Atrasaram', value: totalAtrasaram },
  ].filter(d => d.value > 0);

  const mesLabel = (() => {
    try { return format(new Date(mesSelecionado + '-01'), 'MMMM/yyyy', { locale: ptBR }); } catch { return mesSelecionado; }
  })();

  const cols = [
    { key: 'name', label: 'Workspace / Cliente' },
    { key: 'novas', label: 'Novas', render: r => <span className="text-blue-400 font-semibold">{r.novas}</span> },
    { key: 'concluidas', label: 'Concluídas', render: r => <span className="text-green-400 font-semibold">{r.concluidas}</span> },
    { key: 'atrasaram', label: 'Atrasaram', render: r => <span className="text-red-400 font-semibold">{r.atrasaram}</span> },
    { key: 'taxa', label: 'Conclusão', render: r => {
      const d = r.concluidas + Math.max(r.novas - r.concluidas, 0) + r.atrasaram;
      const pct = d > 0 ? Math.round((r.concluidas / d) * 100) : 0;
      return <span className="text-[#ff5000] font-semibold">{pct}%</span>;
    }},
  ];

  const handleExport = async () => {
    setExporting(true);
    await exportPDF(`Relatório Produtividade — ${mesLabel}`, mesLabel, 'relatorio-produtividade-content');
    setExporting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Fonte: eKyte / Importações</p>
          <p className="text-sm text-gray-300">Competência: <span className="text-[#ff5000] font-semibold">{mesLabel}</span></p>
        </div>
        <Button onClick={handleExport} disabled={exporting} size="sm" className="bg-[#ff5000] hover:bg-[#cc4000] text-white">
          <Download className="w-4 h-4 mr-2" />{exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>

      {wsDoMes.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center gap-4 text-center">
          <BarChart2 className="w-12 h-12 text-gray-600" />
          <p className="text-gray-400">Nenhum dado importado do eKyte para <strong>{mesLabel}</strong>.</p>
          <p className="text-gray-500 text-sm">Importe CSVs na Central de Dados para visualizar a produtividade.</p>
        </div>
      ) : (
        <div id="relatorio-produtividade-content" className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard icon={TrendingUp} label="Conclusão Geral" value={`${pctGeral}%`} color="text-green-400" delay={0} />
            <StatCard icon={Clock} label="Tarefas Novas" value={totalNovas} color="text-blue-400" delay={0.05} />
            <StatCard icon={CheckCircle2} label="Concluídas" value={totalConcluidas} color="text-green-400" delay={0.1} />
            <StatCard icon={Clock} label="Pendentes" value={totalPendentes} color="text-yellow-400" delay={0.15} />
            <StatCard icon={AlertTriangle} label="Atrasaram" value={totalAtrasaram} color="text-red-400" delay={0.2} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard title="Distribuição de Status (eKyte)">
              <SimplePieChart data={pieData} />
            </SectionCard>
            <SectionCard title="Produção por Cliente — Top 15 (eKyte)">
              <SimpleBarChart data={byWorkspace} xKey="name" yKey="concluidas" label="Concluídas" />
            </SectionCard>
          </div>

          <SectionCard title="Detalhe por Workspace">
            <DataTable columns={cols} rows={byWorkspace} />
          </SectionCard>
        </div>
      )}
    </div>
  );
}