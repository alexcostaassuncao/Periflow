import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { localApp } from '@/api/localClient';
import { CheckCircle2, Circle } from 'lucide-react';

const CHECKLIST_ITEMS = [
  { key: 'acesso_recebido', label: 'Acesso recebido' },
  { key: 'briefing_recebido', label: 'Briefing recebido' },
  { key: 'grupo_criado', label: 'Grupo criado' },
  { key: 'contrato_assinado', label: 'Contrato assinado' },
  { key: 'pagamento_recebido', label: 'Pagamento recebido' },
  { key: 'squad_definido', label: 'Squad definido' },
  { key: 'inicio_projeto', label: 'Início do projeto' },
];

export default function OnboardingModal({ open, onClose, lead, onSaved }) {
  const defaultCheck = { acesso_recebido: false, briefing_recebido: false, grupo_criado: false,
    contrato_assinado: false, pagamento_recebido: false, squad_definido: false, inicio_projeto: false };
  const [checklist, setChecklist] = useState({ ...defaultCheck, ...(lead?.checklist_onboarding || {}) });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setChecklist(p => ({ ...p, [key]: !p[key] }));

  const allDone = Object.values(checklist).every(Boolean);

  const handleSave = async (moveToAtivo = false) => {
    setSaving(true);
    const user = await localApp.auth.me();
    const updates = { checklist_onboarding: checklist };
    if (moveToAtivo) {
      updates.status = 'cliente_ativo';
      updates.historico = [...(lead.historico || []), {
        data: new Date().toISOString(),
        usuario_email: user.email,
        usuario_nome: user.full_name,
        status_anterior: lead.status,
        status_novo: 'cliente_ativo',
        observacao: 'Onboarding concluído — cliente ativo',
      }];
    }
    await localApp.entities.CRMLead.update(lead.id, updates);
    setSaving(false);
    onSaved();
    onClose();
  };

  const done = Object.values(checklist).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle>Onboarding — {lead?.nome_empresa}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-gray-500">{done}/{CHECKLIST_ITEMS.length} itens concluídos</p>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(done / CHECKLIST_ITEMS.length) * 100}%` }} />
          </div>
          {CHECKLIST_ITEMS.map(item => (
            <button key={item.key} onClick={() => toggle(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left">
              {checklist[item.key]
                ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                : <Circle className="w-5 h-5 text-gray-600 flex-shrink-0" />}
              <span className={checklist[item.key] ? 'text-white' : 'text-gray-400'}>{item.label}</span>
            </button>
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="text-gray-400">Fechar</Button>
            <Button onClick={() => handleSave(false)} disabled={saving} className="flex-1 bg-white/10 text-white hover:bg-white/20">
              Salvar checklist
            </Button>
            {allDone && (
              <Button onClick={() => handleSave(true)} disabled={saving} className="flex-1 gradient-primary">
                ✓ Marcar como ativo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}