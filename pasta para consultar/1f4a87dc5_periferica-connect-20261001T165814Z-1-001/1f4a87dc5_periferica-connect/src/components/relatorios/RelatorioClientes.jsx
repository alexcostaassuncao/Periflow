import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard, SectionCard, DataTable, SimplePieChart, SimpleBarChart, exportPDF } from './RelatorioUtils';
import { Building2, CheckCircle2, XCircle, Briefcase } from 'lucide-react';

export default function RelatorioClientes({ clients, clienteSquads }) {
  const [exporting, setExporting] = useState(false);

  const ativos = clients.filter(c => c.status === 'ativo').length;
  const inativos = clients.filter(c => c.status === 'inativo').length;

  // Squad mapping
  const squadMap = clienteSquads.reduce((acc, cs) => {
    acc[cs.workspace_nome] = cs.squad_nome;
    return acc;
  }, {});

  const enriched = clients.map(c => ({
    ...c,
    squad: squadMap[c.name?.toUpperCase()] || '—',
  }));

  const byContrato = Object.entries(
    clients.reduce((acc, c) => { acc[c.contract_type || 'N/A'] = (acc[c.contract_type || 'N/A'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const bySquad = Object.entries(
    enriched.reduce((acc, c) => { acc[c.squad] = (acc[c.squad] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).filter(i => i.name !== '—');

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'fantasy_name', label: 'Nome Fantasia' },
    { key: 'contact_name', label: 'Contato' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'segment', label: 'Segmento' },
    { key: 'squad', label: 'Carteira/Squad' },
    { key: 'contract_type', label: 'Tipo Contrato' },
    { key: 'status', label: 'Status', render: r => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {r.status}
      </span>
    )},
  ];

  const handleExport = async () => {
    setExporting(true);
    await exportPDF('Relatório Clientes', 'Geral', 'relatorio-clientes-content');
    setExporting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={exporting} size="sm" className="bg-[#ff5000] hover:bg-[#cc4000] text-white">
          <Download className="w-4 h-4 mr-2" />{exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>
      <div id="relatorio-clientes-content" className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Total Clientes" value={clients.length} color="text-blue-400" delay={0} />
          <StatCard icon={CheckCircle2} label="Ativos" value={ativos} color="text-green-400" delay={0.05} />
          <StatCard icon={XCircle} label="Inativos" value={inativos} color="text-red-400" delay={0.1} />
          <StatCard icon={Briefcase} label="Com Squad" value={bySquad.reduce((a, b) => a + b.value, 0)} color="text-[#ff5000]" delay={0.15} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Por Tipo de Contrato">
            <SimplePieChart data={byContrato} />
          </SectionCard>
          <SectionCard title="Por Carteira/Squad">
            <SimpleBarChart data={bySquad} xKey="name" yKey="value" label="Clientes" />
          </SectionCard>
        </div>
        <SectionCard title="Clientes Cadastrados">
          <DataTable columns={columns} rows={enriched} />
        </SectionCard>
      </div>
    </div>
  );
}