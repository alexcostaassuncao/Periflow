import React from 'react';
import { Users, Mail } from 'lucide-react';

export default function SquadCard({ squad, onEdit, onDelete }) {
  return (
    <div className="bg-[#1a1a2e] rounded-xl p-5 flex flex-col h-full border border-white/5 hover:border-[#ff5000]/30 transition-all">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base mb-1 truncate">
            {squad.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              squad.status === 'ativo' 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {squad.status}
            </div>
          </div>
        </div>
      </div>

      {/* Informações */}
      <div className="flex-1 space-y-2 mb-4">
        {squad.code && (
          <div className="text-sm text-gray-400">
            <span className="text-[#ff5000]">🔖</span> {squad.code}
          </div>
        )}
        
        {squad.manager_email && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{squad.manager_email}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{squad.members?.length || 0} membros</span>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
        <button
          onClick={() => onEdit(squad)}
          className="px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition-all"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(squad.id, squad.name)}
          className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}