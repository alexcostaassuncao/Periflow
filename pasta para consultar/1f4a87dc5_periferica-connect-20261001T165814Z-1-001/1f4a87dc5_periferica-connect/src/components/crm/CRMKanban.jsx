import React from 'react';
import { Users, CalendarCheck, FileSignature, PackageCheck, Star, XCircle, Plus } from 'lucide-react';
import LeadCard from './LeadCard';

const COLUNAS = [
  { key: 'prospeccao', label: 'Prospecção', icon: Users, color: 'text-blue-400', border: 'border-blue-400/30', bg: 'bg-blue-400/5' },
  { key: 'reuniao_marcada', label: 'Reunião', icon: CalendarCheck, color: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/5' },
  { key: 'contrato', label: 'Contrato', icon: FileSignature, color: 'text-green-400', border: 'border-green-400/30', bg: 'bg-green-400/5' },
  { key: 'onboarding', label: 'Onboarding', icon: PackageCheck, color: 'text-purple-400', border: 'border-purple-400/30', bg: 'bg-purple-400/5' },
  { key: 'cliente_ativo', label: 'Cliente ativo', icon: Star, color: 'text-[#ff5000]', border: 'border-[#ff5000]/30', bg: 'bg-[#ff5000]/5' },
  { key: 'cancelado', label: 'Cancelado', icon: XCircle, color: 'text-red-400', border: 'border-red-400/30', bg: 'bg-red-400/5' },
];

export default function CRMKanban({ leads, onRefresh, onNovo }) {
  const byStatus = {};
  COLUNAS.forEach(c => { byStatus[c.key] = []; });
  leads.forEach(l => {
    if (byStatus[l.status] !== undefined) byStatus[l.status].push(l);
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUNAS.map(col => {
        const Icon = col.icon;
        const items = byStatus[col.key] || [];
        return (
          <div key={col.key} className={`flex-shrink-0 w-72 rounded-2xl border ${col.border} ${col.bg} flex flex-col`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <span className={`font-bold text-sm ${col.color}`}>{col.label}</span>
              </div>
              <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
              {col.key === 'prospeccao' && (
                <button onClick={onNovo}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-gray-500 hover:text-white hover:border-white/40 text-xs flex items-center justify-center gap-1.5 transition-all">
                  <Plus className="w-3.5 h-3.5" />Nova ordem
                </button>
              )}
              {items.map((lead, i) => (
                <LeadCard key={lead.id} lead={lead} onRefresh={onRefresh} delay={i * 0.05} />
              ))}
              {items.length === 0 && col.key !== 'prospeccao' && (
                <p className="text-center text-xs text-gray-600 py-8">Vazio</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}