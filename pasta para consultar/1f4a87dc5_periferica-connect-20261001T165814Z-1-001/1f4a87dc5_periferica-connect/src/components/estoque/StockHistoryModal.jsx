import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FIELD_LABELS = {
  name: 'Nome',
  code: 'Código',
  category: 'Categoria',
  description: 'Descrição',
  quantity: 'Quantidade',
  status: 'Status',
  location: 'Localização',
  responsible_email: 'Responsável',
  observations: 'Observações',
  criacao: 'Cadastro',
};

const CHANGE_TYPE_COLORS = {
  criacao: 'bg-green-500/20 text-green-400',
  edicao: 'bg-blue-500/20 text-blue-400',
  exclusao: 'bg-red-500/20 text-red-400',
};

export default function StockHistoryModal({ item, onClose }) {
  const history = [...(item.history || [])].reverse();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-[#ff5000]" />
              <div>
                <h2 className="font-bold text-lg">Histórico de Alterações</h2>
                <p className="text-sm text-gray-400">{item.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma alteração registrada</p>
              </div>
            ) : (
              history.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5000] mt-1 flex-shrink-0" />
                    {i < history.length - 1 && (
                      <div className="w-px flex-1 bg-white/10 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-3">
                    <div className="glass-card rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHANGE_TYPE_COLORS[entry.change_type] || 'bg-gray-500/20 text-gray-400'}`}>
                            {entry.change_type === 'criacao' ? 'Cadastro' : entry.change_type === 'exclusao' ? 'Exclusão' : 'Edição'}
                          </span>
                          <span className="text-sm font-medium text-white">
                            {FIELD_LABELS[entry.field] || entry.field}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {entry.timestamp
                            ? format(new Date(entry.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })
                            : '—'}
                        </div>
                      </div>

                      {entry.change_type !== 'criacao' && (entry.old_value || entry.new_value) && (
                        <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                          <div className="bg-red-500/10 rounded-lg p-2">
                            <p className="text-gray-500 mb-0.5">Antes</p>
                            <p className="text-red-400">{entry.old_value || '—'}</p>
                          </div>
                          <div className="bg-green-500/10 rounded-lg p-2">
                            <p className="text-gray-500 mb-0.5">Depois</p>
                            <p className="text-green-400">{entry.new_value || '—'}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>por {entry.user_name || entry.user_email || 'desconhecido'}</span>
                        {entry.reason && (
                          <span className="italic text-gray-400">"{entry.reason}"</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}