import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ItemHistoricoModal({ item, onClose }) {
  if (!item) return null;
  const historico = (item.historico || []).slice().reverse();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl glass-card rounded-2xl p-6 z-10 max-h-[85vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Histórico de Alterações</h2>
              <p className="text-sm text-gray-400">{item.nome}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {historico.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhuma alteração registrada</p>
              </div>
            ) : (
              historico.map((h, i) => (
                <div key={i} className="rounded-xl bg-black/20 border border-white/5 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#ff5000] uppercase tracking-wide">
                      {h.tipo_alteracao}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {h.data_hora ? format(new Date(h.data_hora), "dd/MM/yy HH:mm", { locale: ptBR }) : '—'}
                    </span>
                  </div>
                  {h.campo_alterado && (
                    <p className="text-sm text-gray-300 mb-1">
                      <span className="text-gray-500">Campo:</span> {h.campo_alterado}
                    </p>
                  )}
                  {(h.valor_anterior || h.novo_valor) && (
                    <div className="flex items-center gap-2 text-sm mb-1">
                      {h.valor_anterior && <span className="text-red-400 line-through">{h.valor_anterior}</span>}
                      {h.valor_anterior && h.novo_valor && <span className="text-gray-500">→</span>}
                      {h.novo_valor && <span className="text-green-400">{h.novo_valor}</span>}
                    </div>
                  )}
                  {h.motivo && (
                    <p className="text-xs text-gray-400 mt-1">Motivo: {h.motivo}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{h.usuario_nome || h.usuario_email}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}