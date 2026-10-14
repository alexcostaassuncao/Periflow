import React from 'react';
import { Edit, Trash2, Eye, Shield } from 'lucide-react';

const CARTEIRA_COLORS = {
  c1: 'bg-blue-500/20 text-blue-400',
  c2: 'bg-purple-500/20 text-purple-400',
  c3: 'bg-green-500/20 text-green-400',
  c4: 'bg-yellow-500/20 text-yellow-400',
  gerencia: 'bg-orange-500/20 text-orange-400',
  videomaker: 'bg-pink-500/20 text-pink-400',
  comercial: 'bg-teal-500/20 text-teal-400',
};

const NIVEL_LABELS = {
  admin: '👑 Admin',
  gestor_carteira: '🔰 Gestor',
  gerente: '👔 Gerente',
  coo: '🏢 COO',
  consultor: '💼 Consultor',
  designer: '🎨 Designer',
  copy: '✍️ Copy',
  video_maker: '🎥 Video Maker',
  gestor_trafego: '📊 Tráfego',
};

export default function UnifiedEmployeeCard({ employee, linkedUser, userRole, onView, onEdit, onDelete, onPermissions }) {
  const carteira = employee?.carteira;
  const carteiraColor = CARTEIRA_COLORS[carteira] || 'bg-gray-500/20 text-gray-400';
  const nivel = employee?.nivel_acesso || userRole?.papel || 'consultor';

  return (
    <div className="p-4 rounded-xl bg-[#1a1a2e] hover:bg-[#1a1a2e]/80 transition-all border border-white/5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#ff5000]/20 flex items-center justify-center shrink-0">
          {employee?.avatar_url
            ? <img src={employee.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-xl font-bold text-[#ff5000]">{linkedUser?.full_name?.charAt(0) || '?'}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{linkedUser?.full_name || 'Sem nome'}</h4>
          <p className="text-xs text-gray-400 truncate">{linkedUser?.email || '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">{employee?.position || 'Cargo não definido'}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
          employee?.employee_status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {employee?.employee_status === 'ativo' ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {carteira ? (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${carteiraColor}`}>
            🏷️ {carteira}
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">
            ⚠️ Sem carteira
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
          {NIVEL_LABELS[nivel] || nivel}
        </span>
        {employee?.department && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
            {employee.department}
          </span>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-0.5 mb-3">
        {employee?.phone && <p>📱 {employee.phone}</p>}
        {employee?.start_date && <p>📅 Desde {new Date(employee.start_date).toLocaleDateString('pt-BR')}</p>}
        {employee?.contract_type && <p>📋 {employee.contract_type?.toUpperCase()}</p>}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => onView(employee)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs transition-colors"
        >
          <Eye className="w-3 h-3" /> Ver
        </button>
        <button
          onClick={() => onEdit(employee)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs transition-colors"
        >
          <Edit className="w-3 h-3" /> Editar
        </button>
        <button
          onClick={() => onPermissions(linkedUser)}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-[#ff5000]/20 hover:bg-[#ff5000]/30 text-[#ff5000] text-xs transition-colors"
          title="Gerenciar permissões"
        >
          <Shield className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(employee.id, linkedUser?.full_name)}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}