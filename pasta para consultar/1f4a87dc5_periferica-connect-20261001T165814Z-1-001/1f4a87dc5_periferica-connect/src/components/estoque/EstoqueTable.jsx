import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Pencil, History, Trash2, Package, User, Wrench, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIA_LABELS = {
  informatica: 'Informática', mobiliario: 'Mobiliário', eletronico: 'Eletrônico',
  audio_video: 'Áudio/Vídeo', comunicacao: 'Comunicação', ferramenta: 'Ferramenta',
  papelaria: 'Papelaria', outros: 'Outros',
};

const LOC_CONFIG = {
  estoque: { label: 'Em Estoque', color: '#22c55e', icon: Package },
  com_funcionario: { label: 'C/ Funcionário', color: '#3b82f6', icon: User },
  manutencao: { label: 'Manutenção', color: '#f59e0b', icon: Wrench },
  descartado: { label: 'Descartado', color: '#6b7280', icon: Archive },
};

const STATUS_CONFIG = {
  ativo: { label: 'Ativo', color: '#22c55e' },
  inativo: { label: 'Inativo', color: '#f59e0b' },
  excluido: { label: 'Excluído', color: '#ef4444' },
};

export default function EstoqueTable({ items, onView, onEdit, onHistory, onDelete, canEdit }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Nenhum item encontrado</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            {['Nome / Código', 'Categoria', 'Qtd', 'Localização', 'Responsável', 'Status', 'Atualizado', 'Ações'].map(h => (
              <th key={h} className="text-left text-xs text-gray-500 font-medium pb-3 pr-4 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map(item => {
            const loc = LOC_CONFIG[item.localizacao] || LOC_CONFIG.estoque;
            const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.ativo;
            const LocIcon = loc.icon;
            return (
              <tr key={item.id} className="hover:bg-white/3 transition-colors group">
                <td className="py-3 pr-4">
                  <p className="font-medium text-white">{item.nome}</p>
                  {item.codigo && <p className="text-xs text-gray-500">{item.codigo}</p>}
                </td>
                <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                  {CATEGORIA_LABELS[item.categoria] || item.categoria}
                </td>
                <td className="py-3 pr-4 text-gray-300 font-mono">{item.quantidade ?? 1}</td>
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-1 text-xs font-medium whitespace-nowrap" style={{ color: loc.color }}>
                    <LocIcon className="w-3 h-3" />
                    {loc.label}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-400 text-xs">
                  {item.localizacao === 'com_funcionario' ? (item.funcionario_responsavel_nome || '—') : '—'}
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</span>
                </td>
                <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">
                  {item.updated_date
                    ? format(new Date(item.updated_date), 'dd/MM/yy HH:mm', { locale: ptBR })
                    : '—'}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => onView(item)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {canEdit && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-[#ff5000]" onClick={() => onEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-blue-400" onClick={() => onHistory(item)}>
                      <History className="w-3.5 h-3.5" />
                    </Button>
                    {canEdit && item.status !== 'excluido' && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-400" onClick={() => onDelete(item)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
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