import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { localApp } from '@/api/localClient';

export default function ReuniaoModal({ open, onClose, lead, onSaved }) {
  const [dataReuniao, setDataReuniao] = useState(lead?.data_reuniao?.slice(0, 16) || '');
  const [obs, setObs] = useState(lead?.observacoes_reuniao || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const user = await localApp.auth.me();
    const hist = [...(lead.historico || []), {
      data: new Date().toISOString(),
      usuario_email: user.email,
      usuario_nome: user.full_name,
      status_anterior: lead.status,
      status_novo: 'reuniao_marcada',
      observacao: `Reunião marcada para ${dataReuniao}`,
    }];

    const dataISO = dataReuniao ? new Date(dataReuniao).toISOString() : null;

    // Calcula end_datetime (1h depois)
    const endISO = dataISO
      ? new Date(new Date(dataISO).getTime() + 60 * 60 * 1000).toISOString()
      : null;

    await localApp.entities.CRMLead.update(lead.id, {
      status: 'reuniao_marcada',
      data_reuniao: dataISO,
      observacoes_reuniao: obs,
      historico: hist,
    });

    // Criar ou atualizar evento no Calendário
    const eventTitle = `Reunião comercial - ${lead.nome_empresa || lead.nome_contato}`;
    const eventDesc = [
      `Cliente: ${lead.nome_contato}`,
      `Empresa: ${lead.nome_empresa || '—'}`,
      `Telefone: ${lead.telefone || '—'}`,
      `Segmento: ${lead.segmento || '—'}`,
      obs ? `Obs: ${obs}` : '',
      `Responsável: ${lead.responsavel_nome || user.full_name}`,
    ].filter(Boolean).join('\n');

    if (lead.calendar_event_id) {
      // Reagendar: atualizar evento existente
      await localApp.entities.CalendarEvent.update(lead.calendar_event_id, {
        start_datetime: dataISO,
        end_datetime: endISO,
        description: eventDesc,
      });
    } else {
      // Nova reunião: criar evento
      const newEvent = await localApp.entities.CalendarEvent.create({
        title: eventTitle,
        description: eventDesc,
        event_type: 'reuniao_comercial',
        start_datetime: dataISO,
        end_datetime: endISO,
        prospect_name: lead.nome_contato,
        participants: lead.responsavel_email ? [lead.responsavel_email] : [],
        conversion_status: 'pendente',
      });
      // Salvar o id do evento no lead para futuras atualizações
      await localApp.entities.CRMLead.update(lead.id, { calendar_event_id: newEvent.id });
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar Reunião — {lead?.nome_empresa}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Data e hora da reunião</Label>
            <Input type="datetime-local" value={dataReuniao} onChange={e => setDataReuniao(e.target.value)}
              className="bg-[#1a1a2e] border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Observações internas</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Pauta, local, link de vídeo..." rows={3}
              className="bg-[#1a1a2e] border-white/10 text-white resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-gray-400">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary">
              {saving ? 'Salvando...' : 'Confirmar reunião'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}