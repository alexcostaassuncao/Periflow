import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Pencil, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORY_LABELS = {
  informatica: 'Informática',
  mobiliario: 'Mobiliário',
  audio_video: 'Áudio/Vídeo',
  escritorio: 'Escritório',
  estudio: 'Estúdio',
  ferramentas: 'Ferramentas',
  outros: 'Outros',
};

const STATUS_CONFIG = {
  em_estoque: { label: 'Em Estoque', color: 'bg-green-500/20 text-green-400' },
  com_funcionario: { label: 'Com Funcionário', color: 'bg-blue-500/20 text-blue-400' },
  em_manutencao: { label: 'Manutenção', color: 'bg-yellow-500/20 text-yellow-400' },
  descartado: { label: 'Descartado', color: 'bg-gray-500/20 text-gray-400' },
};

export default function StockTable({ items, isAdmin, onEdit, onDelete, onViewHistory }) {
  if (items.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-gray-500">
        <p className="text-lg font-medium">Nenhum item encontrado</p>
        <p className="text-sm mt-1">Ajuste os filtros ou cadastre novos itens</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs text-gray-400 font-medium">ITEM</th>
              <th className="text-left p-4 text-xs text-gray-400 font-medium">CÓDIGO</th>
              <th className="text-left p-4 text-xs text-gray-400 font-medium">CATEGORIA</th>
              <th className="text-center p-4 text-xs text-gray-400 font-medium">QTD</th>
              <th className="text-left p-4 text-xs text-gray-400 font-medium">STATUS</th>
              <th className="text-left p-4 text-xs text-gray-400 font-medium">LOCALIZAÇÃO</th>
              <th className="text-left p-4 text-xs text-gray-400 font-medium">RESPONSÁVEL</th>
              <th className="text-left p-4 text-xs text-gray-400 font-medium">ATUALIZADO</th>
              <th className="text-right p-4 text-xs text-gray-400 font-medium">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.descartado;
              return (
                <tr
                  key={item.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    item.is_deleted ? 'opacity-50' : ''
                  }`}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.observations && (
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{item.observations}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-300">{item.code || '—'}</td>
                  <td className="p-4 text-sm text-gray-300">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </td>
                  <td className="p-4 text-center text-sm font-bold">{item.quantity ?? 1}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                      {sc.label}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-300">{item.location || '—'}</td>
                  <td className="p-4 text-sm text-gray-300">{item.responsible_name || '—'}</td>
                  <td className="p-4 text-xs text-gray-500">
                    {item.updated_date
                      ? format(new Date(item.updated_date), "dd/MM/yy HH:mm", { locale: ptBR })
                      : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 text-gray-400 hover:text-white"
                        onClick={() => onViewHistory(item)}
                        title="Histórico"
                      >
                        <History className="w-3.5 h-3.5" />
                      </Button>
                      {isAdmin && !item.is_deleted && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-gray-400 hover:text-white"
                            onClick={() => onEdit(item)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-gray-400 hover:text-red-400"
                            onClick={() => onDelete(item)}
                            title="Inativar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}