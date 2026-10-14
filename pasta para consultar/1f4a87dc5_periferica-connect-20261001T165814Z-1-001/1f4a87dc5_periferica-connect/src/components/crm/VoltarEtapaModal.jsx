import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { localApp } from '@/api/localClient';
import { ArrowLeft } from 'lucide-react';

const STATUS_LABELS = {
  prospeccao: 'Prospecção',
  reuniao_marcada: 'Reunião',
  contrato: 'Contrato',
  onboarding: 'Onboarding',
  cliente_ativo: 'Cliente ativo',
};

// Define quais etapas anteriores são permitidas para cada status atual
const ETAPAS_ANTERIORES = {
  reuniao_marcada: ['prospeccao'],
  contrato: ['reuniao_marcada'],
  onboarding: ['contrato'],
  cliente_ativo: ['onboarding', 'contrato'],
};

export default function VoltarEtapaModal({ open, onClose, lead, onSaved }) {
  const opcoes = ETAPAS_ANTERIORES[lead?.status] || [];
  const [novoStatus, setNovoStatus] = useState(opcoes[0] || '');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);

  const handleVoltar = async () => {
    if (!novoStatus) return;
    setSaving(true);
    const user = await localApp.auth.me();
    const hist = [...(lead.historico || []), {
      data: new Date().toISOString(),
      usuario_email: user.email,
      usuario_nome: user.full_name,
      status_anterior: lead.status,
      status_novo: novoStatus,
      observacao: observacao || `Retornou de ${STATUS_LABELS[lead.status]} para ${STATUS_LABELS[novoStatus]}`,
    }];
    await localApp.entities.CRMLead.update(lead.id, {
      status: novoStatus,
      historico: hist,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  if (opcoes.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 text-yellow-400" />
            Voltar etapa — {lead?.nome_empresa}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-300">
            Etapa atual: <strong>{STATUS_LABELS[lead?.status]}</strong>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Retornar para</Label>
            <Select value={novoStatus} onValueChange={setNovoStatus}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                <SelectValue placeholder="Selecione a etapa..." />
              </SelectTrigger>
              <SelectContent>
                {opcoes.map(op => (
                  <SelectItem key={op} value={op}>{STATUS_LABELS[op]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Motivo / Observação (opcional)</Label>
            <Textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Descreva o motivo do retorno..."
              className="bg-[#1a1a2e] border-white/10 text-white resize-none h-20"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
            <Button
              onClick={handleVoltar}
              disabled={saving || !novoStatus}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {saving ? 'Movendo...' : `Voltar para ${STATUS_LABELS[novoStatus] || '...'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}