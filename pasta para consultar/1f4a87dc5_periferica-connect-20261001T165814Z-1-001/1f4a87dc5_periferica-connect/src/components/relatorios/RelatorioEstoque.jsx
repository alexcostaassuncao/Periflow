import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard, SectionCard, DataTable, SimplePieChart, SimpleBarChart, exportPDF } from './RelatorioUtils';
import { Package, User, Wrench, Archive } from 'lucide-react';

const CAT_LABELS = {
  informatica: 'Informática', mobiliario: 'Mobiliário', eletronico: 'Eletrônico',
  audio_video: 'Áudio/Vídeo', comunicacao: 'Comunicação', ferramenta: 'Ferramenta',
  papelaria: 'Papelaria', outros: 'Outros',
};

const LOC_LABELS = {
  estoque: 'Estoque', com_funcionario: 'Com Funcionário',
  manutencao: 'Manutenção', descartado: 'Descartado',
};

export default function RelatorioEstoque({ items }) {
  const [exporting, setExporting] = useState(false);

  const ativos = items.filter(i => i.status === 'ativo').length;
  const comFuncionario = items.filter(i => i.localizacao === 'com_funcionario').length;
  const emManutencao = items.filter(i => i.localizacao === 'manutencao').length;
  const noEstoque = items.filter(i => i.localizacao === 'estoque').length;

  const byCategoria = Object.entries(
    items.reduce((acc, i) => { const c = CAT_LABELS[i.categoria] || i.categoria || 'Outros'; acc[c] = (acc[c] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const byLocalizacao = Object.entries(
    items.reduce((acc, i) => { const l = LOC_LABELS[i.localizacao] || i.localizacao || '—'; acc[l] = (acc[l] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const columns = [
    { key: 'nome', label: 'Item' },
    { key: 'codigo', label: 'Código' },
    { key: 'categoria', label: 'Categoria', render: r => CAT_LABELS[r.categoria] || r.categoria },
    { key: 'quantidade', label: 'Qtd' },
    { key: 'localizacao', label: 'Localização', render: r => LOC_LABELS[r.localizacao] || r.localizacao },
    { key: 'funcionario_responsavel_nome', label: 'Com Funcionário' },
    { key: 'status', label: 'Status', render: r => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        {r.status}
      </span>
    )},
  ];

  const handleExport = async () => {
    setExporting(true);
    await exportPDF('Relatório Estoque', 'Período selecionado', 'relatorio-estoque-content');
    setExporting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={exporting} size="sm" className="bg-[#ff5000] hover:bg-[#cc4000] text-white">
          <Download className="w-4 h-4 mr-2" />{exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>
      <div id="relatorio-estoque-content" className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Itens Ativos" value={ativos} color="text-green-400" delay={0} />
          <StatCard icon={Archive} label="No Estoque" value={noEstoque} color="text-blue-400" delay={0.05} />
          <StatCard icon={User} label="Com Funcionário" value={comFuncionario} color="text-[#ff5000]" delay={0.1} />
          <StatCard icon={Wrench} label="Em Manutenção" value={emManutencao} color="text-yellow-400" delay={0.15} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Itens por Categoria">
            <SimplePieChart data={byCategoria} />
          </SectionCard>
          <SectionCard title="Localização dos Equipamentos">
            <SimpleBarChart data={byLocalizacao} xKey="name" yKey="value" label="Itens" />
          </SectionCard>
        </div>
        <SectionCard title="Inventário Completo">
          <DataTable columns={columns} rows={items.filter(i => i.status !== 'excluido')} />
        </SectionCard>
      </div>
    </div>
  );
}