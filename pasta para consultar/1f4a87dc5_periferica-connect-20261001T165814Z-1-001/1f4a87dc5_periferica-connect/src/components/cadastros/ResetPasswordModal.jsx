import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { localApp } from '@/api/localClient';
import { KeyRound, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordModal({ open, onClose, targetUser, adminUser, onLog }) {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async () => {
    setLoading(true);
    try {
      await localApp.auth.resetPasswordRequest(targetUser.email);

      // Registrar log
      if (onLog) {
        await onLog('update', 'User', targetUser.id, targetUser.full_name, {
          acao: 'reset_senha',
          disparado_por: adminUser.email,
          disparado_por_nome: adminUser.full_name,
          usuario_alvo: targetUser.email,
          data: new Date().toISOString(),
          observacao: 'E-mail de redefinição de senha enviado pelo administrador',
        });
      }

      setStep('success');
    } catch (e) {
      setErrorMsg(e?.message || 'Erro ao enviar e-mail de redefinição.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-yellow-400" />
            Redefinir senha — {targetUser?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {step === 'confirm' && (
            <>
              <div className="rounded-xl bg-[#1a1a2e] border border-white/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{targetUser?.email}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Um e-mail de redefinição de senha será enviado para o endereço acima. O usuário receberá um link para criar uma nova senha. Esta ação ficará registrada no histórico do sistema.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose} className="text-gray-400 flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-white">E-mail enviado com sucesso!</p>
                <p className="text-sm text-gray-400 mt-1">
                  {targetUser?.email} receberá as instruções para redefinir a senha.
                </p>
                <p className="text-xs text-gray-500 mt-2">A ação foi registrada no histórico do sistema.</p>
              </div>
              <Button onClick={onClose} className="gradient-primary w-full">Fechar</Button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Erro ao enviar e-mail</p>
                <p className="text-sm text-red-400 mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose} className="text-gray-400 flex-1">Fechar</Button>
                <Button onClick={() => setStep('confirm')} className="flex-1 gradient-primary">Tentar novamente</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}