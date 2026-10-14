import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { localApp } from '@/api/localClient';

const MOTIVOS = [
  { value: 'sem_retorno', label: 'Sem retorno' },
  { value: 'valor_alto', label: 'Valor alto' },
  { value: 'fechou_concorrente', label: 'Fechou com concorrente' },
  { value: 'desistiu', label: 'Desistiu' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'outro', label: 'Outro' },
];

export default function EncerrarModal({ open, onClose, lead, onSaved }) {
  const [motivo, setMotivo] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEncerrar = async () => {
    setSaving(true);
    const user = await localApp.auth.me();
    const hist = [...(lead.historico || []), {
      data: new Date().toISOString(),
      usuario_email: user.email,
      usuario_nome: user.full_name,
      status_anterior: lead.status,
      status_novo: 'cancelado',
      observacao: `Encerrado: ${MOTIVOS.find(m => m.value === motivo)?.label}. ${obs}`,
    }];
    await localApp.entities.CRMLead.update(lead.id, {
      status: 'cancelado',
      motivo_cancelamento: motivo,
      observacoes_cancelamento: obs,
      historico: hist,
    });

    // Cancelar evento no calendário se existir
    if (lead.calendar_event_id) {
      await localApp.entities.CalendarEvent.update(lead.calendar_event_id, {
        conversion_status: 'nao_avancou',
        conversion_notes: `Encerrado: ${MOTIVOS.find(m => m.value === motivo)?.label}. ${obs}`,
      });
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-400">Encerrar negociação — {lead?.nome_empresa}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Motivo *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Observações</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
              className="bg-[#1a1a2e] border-white/10 text-white resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-gray-400">Voltar</Button>
            <Button onClick={handleEncerrar} disabled={saving || !motivo} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {saving ? 'Encerrando...' : 'Encerrar negociação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}