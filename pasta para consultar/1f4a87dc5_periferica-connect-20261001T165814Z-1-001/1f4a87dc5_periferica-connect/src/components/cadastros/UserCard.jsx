import React, { useState } from 'react';
import { Users, Mail, KeyRound, Shield } from 'lucide-react';
import ResetPasswordModal from './ResetPasswordModal';

const PAPEL_LABELS = {
  admin: 'Admin',
  coo: 'COO',
  gerente_admin: 'Gerente Admin',
  gerente: 'Gerente',
  gestor_carteira: 'Gestor de Carteira',
  consultor: 'Consultor',
  designer: 'Designer',
  video_maker: 'Video Maker',
  copy: 'Copy',
  gestor_trafego: 'Gestor de Tráfego',
};

export default function UserCard({ user, onView, onPermissions, onIncorporate, onDelete, showActions = true, userRole, adminUser, onLog }) {
  const [showResetModal, setShowResetModal] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const roleStatus = userRole?.status;
  const papel = userRole?.papel;

  return (
    <>
      <div className="bg-[#1a1a2e] rounded-xl p-5 flex flex-col h-full border border-white/5 hover:border-[#ff5000]/30 transition-all">
        {/* Header do Card */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff5000] to-[#cc4000] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">{getInitials(user.full_name)}</span>
            </div>
            {/* Indicador ativo/inativo */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1a1a2e] ${
              roleStatus === 'inativo' ? 'bg-gray-500' : 'bg-green-400'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base mb-1 truncate">
              {user.full_name || 'Sem nome'}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'admin'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                {user.role === 'admin' ? 'Admin' : 'Usuário'}
              </div>
              {papel && (
                <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#ff5000]/20 text-[#ff7040]">
                  {PAPEL_LABELS[papel] || papel}
                </div>
              )}
              {roleStatus === 'inativo' && (
                <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                  Inativo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="flex-1 space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>

          {user.position && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{user.position}</span>
            </div>
          )}

          {user.department && (
            <div className="text-xs text-gray-500">
              Departamento: {user.department}
            </div>
          )}
        </div>

        {/* Ações */}
        {showActions && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
            <button
              onClick={() => onView(user)}
              className="px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium transition-all"
            >
              Visualizar
            </button>
            <button
              onClick={() => onPermissions(user)}
              className="px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-medium transition-all flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3" />Acessos
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-medium transition-all flex items-center justify-center gap-1"
            >
              <KeyRound className="w-3 h-3" />Redefinir senha
            </button>
            <button
              onClick={() => onDelete(user.id, user.full_name)}
              className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all"
            >
              Excluir
            </button>
          </div>
        )}
      </div>

      {showResetModal && (
        <ResetPasswordModal
          open={showResetModal}
          onClose={() => setShowResetModal(false)}
          targetUser={user}
          adminUser={adminUser}
          onLog={onLog}
        />
      )}
    </>
  );
}