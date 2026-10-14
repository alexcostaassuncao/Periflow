import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, FileSpreadsheet, CheckCircle, XCircle, Loader2, Clock, Calendar, Plus, RefreshCw } from 'lucide-react';

const statusIcon = {
  aguardando: <Clock className="w-4 h-4 text-gray-400" />,
  processando: <Loader2 className="w-4 h-4 text-[#ff5000] animate-spin" />,
  concluido: <CheckCircle className="w-4 h-4 text-green-400" />,
  erro: <XCircle className="w-4 h-4 text-red-400" />,
};

const statusLabel = {
  aguardando: 'Aguardando',
  processando: 'Processando',
  concluido: 'Concluído',
  erro: 'Erro',
};

const statusClass = {
  aguardando: 'bg-gray-500/20 text-gray-300',
  processando: 'bg-orange-500/20 text-orange-300',
  concluido: 'bg-green-500/20 text-green-300',
  erro: 'bg-red-500/20 text-red-300',
};

function formatMes(mes) {
  if (!mes) return '—';
  try {
    const [year, month] = mes.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return format(d, 'MMMM/yyyy', { locale: ptBR });
  } catch { return mes; }
}

export default function ImportHistoryTable({ imports }) {
  if (!imports || imports.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Nenhuma importação realizada ainda</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-white/10">
            <th className="text-left pb-3 pr-4">Arquivo</th>
            <th className="text-left pb-3 pr-4">Data de importação</th>
            <th className="text-left pb-3 pr-4">Competência</th>
            <th className="text-left pb-3 pr-4">Usuário</th>
            <th className="text-left pb-3 pr-4">Status</th>
            <th className="text-left pb-3 pr-4">Total</th>
            <th className="text-left pb-3">Criados / Atualizados</th>
          </tr>
        </thead>
        <tbody>
          {imports.map((imp) => {
            const detail = imp.records?.[0];
            const created = detail?.created ?? '—';
            const updated = detail?.updated ?? '—';
            return (
              <tr key={imp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#ff5000] flex-shrink-0" />
                    <span className="truncate max-w-[180px]" title={imp.file_name}>{imp.file_name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-400">
                  {format(new Date(imp.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-[#ff5000]/15 text-[#ff5000]">
                    <Calendar className="w-3 h-3" />
                    {formatMes(imp.mes_referencia)}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-300">{imp.imported_by_name || imp.imported_by}</td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusClass[imp.status]}`}>
                    {statusIcon[imp.status]}
                    {statusLabel[imp.status]}
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-center">{imp.total_records || 0}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1 text-green-400">
                      <Plus className="w-3 h-3" />{created}
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <RefreshCw className="w-3 h-3" />{updated}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}