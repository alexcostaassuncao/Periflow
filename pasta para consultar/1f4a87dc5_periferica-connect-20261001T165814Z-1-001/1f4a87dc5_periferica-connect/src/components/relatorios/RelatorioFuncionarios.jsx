import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard, SectionCard, DataTable, SimplePieChart, SimpleBarChart, exportPDF } from './RelatorioUtils';
import { Users, UserCheck, UserX, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

const DEPT_LABELS = {
  social_media: 'Social Media', design: 'Design', trafego: 'Tráfego',
  atendimento: 'Atendimento', gestao: 'Gestão',
};

const CARTEIRA_LABELS = {
  c1: 'C1', c2: 'C2', c3: 'C3', c4: 'C4',
  gerencia: 'Gerência', videomaker: 'Videomaker', comercial: 'Comercial',
};

export default function RelatorioFuncionarios({ employees, users }) {
  const [exporting, setExporting] = useState(false);

  const ativos = employees.filter(e => e.employee_status === 'ativo').length;
  const inativos = employees.filter(e => e.employee_status === 'inativo').length;
  const semCarteira = employees.filter(e => !e.carteira).length;

  const byDept = Object.entries(
    employees.reduce((acc, e) => { const d = DEPT_LABELS[e.department] || e.department || 'N/A'; acc[d] = (acc[d] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const byCarteira = Object.entries(
    employees.reduce((acc, e) => { const c = CARTEIRA_LABELS[e.carteira] || e.carteira || 'Sem Carteira'; acc[c] = (acc[c] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

  const enriched = employees.map(e => ({
    ...e,
    nome: userMap[e.user_id]?.full_name || '—',
    email: userMap[e.user_id]?.email || '—',
  }));

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'position', label: 'Cargo' },
    { key: 'department', label: 'Setor', render: r => DEPT_LABELS[r.department] || r.department },
    { key: 'carteira', label: 'Carteira', render: r => CARTEIRA_LABELS[r.carteira] || r.carteira || '—' },
    { key: 'contract_type', label: 'Contrato', render: r => r.contract_type?.toUpperCase() || '—' },
    { key: 'start_date', label: 'Início', render: r => r.start_date ? format(new Date(r.start_date), 'dd/MM/yyyy') : '—' },
    { key: 'employee_status', label: 'Status', render: r => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.employee_status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {r.employee_status}
      </span>
    )},
  ];

  const handleExport = async () => {
    setExporting(true);
    await exportPDF('Relatório Funcionários', 'Geral', 'relatorio-funcionarios-content');
    setExporting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={exporting} size="sm" className="bg-[#ff5000] hover:bg-[#cc4000] text-white">
          <Download className="w-4 h-4 mr-2" />{exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>
      <div id="relatorio-funcionarios-content" className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Funcionários" value={employees.length} color="text-blue-400" delay={0} />
          <StatCard icon={UserCheck} label="Ativos" value={ativos} color="text-green-400" delay={0.05} />
          <StatCard icon={UserX} label="Inativos" value={inativos} color="text-red-400" delay={0.1} />
          <StatCard icon={Briefcase} label="Sem Carteira" value={semCarteira} color="text-yellow-400" delay={0.15} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Por Setor">
            <SimplePieChart data={byDept} />
          </SectionCard>
          <SectionCard title="Por Carteira/Squad">
            <SimpleBarChart data={byCarteira} xKey="name" yKey="value" label="Funcionários" />
          </SectionCard>
        </div>
        <SectionCard title="Cadastro de Funcionários">
          <DataTable columns={columns} rows={enriched} />
        </SectionCard>
      </div>
    </div>
  );
}