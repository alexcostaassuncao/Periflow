import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { localApp } from '@/api/localClient';
import { format } from 'date-fns';

export default function LeadFormModal({ open, onClose, lead, onSaved }) {
  const isEditing = !!lead;
  const [form, setForm] = useState({
    nome_contato: lead?.nome_contato || '',
    telefone: lead?.telefone || '',
    nome_empresa: lead?.nome_empresa || '',
    segmento: lead?.segmento || '',
    email: lead?.email || '',
    observacoes: lead?.observacoes || '',
    status: lead?.status || 'prospeccao',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nome_contato || !form.telefone || !form.nome_empresa) return;
    setSaving(true);
    const user = await localApp.auth.me();
    const mesRef = format(new Date(), 'yyyy-MM');

    const payload = {
      ...form,
      observacoes: form.observacoes.slice(0, 500),
      mes_referencia: lead?.mes_referencia || mesRef,
      responsavel_email: lead?.responsavel_email || user.email,
      responsavel_nome: lead?.responsavel_nome || user.full_name,
    };

    if (isEditing) {
      await localApp.entities.CRMLead.update(lead.id, payload);
    } else {
      await localApp.entities.CRMLead.create(payload);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#12121a] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Prospect' : 'Nova Ordem / Prospect'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Nome do contato *</Label>
              <Input value={form.nome_contato} onChange={e => set('nome_contato', e.target.value)}
                placeholder="João Silva" className="bg-[#1a1a2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Telefone *</Label>
              <Input value={form.telefone} onChange={e => set('telefone', e.target.value)}
                placeholder="(48) 99999-9999" className="bg-[#1a1a2e] border-white/10 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Nome da empresa *</Label>
              <Input value={form.nome_empresa} onChange={e => set('nome_empresa', e.target.value)}
                placeholder="Empresa Ltda." className="bg-[#1a1a2e] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Ramo/Segmento</Label>
              <Input value={form.segmento} onChange={e => set('segmento', e.target.value)}
                placeholder="Ex: Varejo, Saúde..." className="bg-[#1a1a2e] border-white/10 text-white" />
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">E-mail</Label>
            <Input value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="contato@empresa.com" className="bg-[#1a1a2e] border-white/10 text-white" />
          </div>
          {isEditing && (
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospeccao">Em andamento</SelectItem>
                  <SelectItem value="reuniao_marcada">Reunião marcada</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">
              Observações <span className="text-gray-600">({form.observacoes.length}/500)</span>
            </Label>
            <Textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value.slice(0, 500))}
              placeholder="Observações sobre o prospect..." rows={3}
              className="bg-[#1a1a2e] border-white/10 text-white resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-gray-400">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.nome_contato || !form.telefone || !form.nome_empresa}
              className="flex-1 gradient-primary">
              {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar prospect'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}