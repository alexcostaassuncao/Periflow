import React from 'react';
import { AlertTriangle, Clock, User, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  pendente: 'bg-yellow-500/20 text-yellow-300',
  atrasado: 'bg-red-500/20 text-red-300',
  em_andamento: 'bg-blue-500/20 text-blue-300',
};

export default function PendenciasTable({ records }) {
  const pendentes = records.filter(r =>
    r.status !== 'concluido' && r.status !== 'concluída' && r.status !== 'concluida'
  );

  if (pendentes.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Nenhuma pendência encontrada para os filtros selecionados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-white/10">
            <th className="text-left pb-3 pr-4">Cliente</th>
            <th className="text-left pb-3 pr-4">Tarefa</th>
            <th className="text-left pb-3 pr-4">Squad</th>
            <th className="text-left pb-3 pr-4">Responsável</th>
            <th className="text-left pb-3 pr-4">Prazo</th>
            <th className="text-left pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="space-y-2">
          {pendentes.map((r, i) => (
            <tr
              key={i}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-[#ff5000]" />
                  <span>{r.cliente || '—'}</span>
                </div>
              </td>
              <td className="py-3 pr-4 font-medium">{r.tipo_tarefa || '—'}</td>
              <td className="py-3 pr-4">
                <span className="px-2 py-0.5 rounded-full text-xs bg-[#ff5000]/20 text-[#ff5000]">
                  {r.squad || '—'}
                </span>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>{r.responsavel || '—'}</span>
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{r.prazo || '—'}</span>
                </div>
              </td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-gray-500/20 text-gray-300'}`}>
                  {r.status || 'pendente'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}