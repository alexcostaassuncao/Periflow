import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CalendarCheck, FileSignature, XCircle, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localApp } from '@/api/localClient';
import { format } from 'date-fns';

const MOTIVO_LABELS = {
  sem_retorno: 'Sem retorno', valor_alto: 'Valor alto', fechou_concorrente: 'Fechou c/ concorrente',
  desistiu: 'Desistiu', cancelado: 'Cancelado', outro: 'Outro',
};

function MetaCard({ icon: Icon, label, meta, realizado, color, leads, onEditMeta }) {
  const [expanded, setExpanded] = useState(false);
  const pct = meta > 0 ? Math.min(100, Math.round((realizado / meta) * 100)) : 0;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.bg}`}>
            <Icon className={`w-5 h-5 ${color.text}`} />
          </div>
          <div>
            <p className="font-bold text-white">{label}</p>
            <p className="text-xs text-gray-500">Meta: {meta}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-black ${color.text}`}>{pct}%</p>
          <p className="text-xs text-gray-500">{realizado} de {meta}</p>
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color.bar}`}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onEditMeta} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-all">
          <Pencil className="w-3 h-3" />Editar meta
        </button>
        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-all">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Ver lista
        </button>
      </div>
      {expanded && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          {leads.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Nenhum registro</p>}
          {leads.map(lead => (
            <LeadMiniRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadMiniRow({ lead }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2 text-xs">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-medium text-white">{lead.nome_contato}</p>
          <p className="text-gray-500">{lead.nome_empresa}</p>
        </div>
        <div className="text-right text-gray-500 flex-shrink-0">
          {lead.telefone && <p>{lead.telefone}</p>}
          {lead.segmento && <p className="text-gray-600">{lead.segmento}</p>}
          {lead.data_reuniao && <p className="text-blue-400">{format(new Date(lead.data_reuniao), 'dd/MM HH:mm')}</p>}
          {lead.dados_contrato?.valor_mensal && (
            <p className="text-green-400">R$ {Number(lead.dados_contrato.valor_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</p>
          )}
          {lead.motivo_cancelamento && <p className="text-red-400">{MOTIVO_LABELS[lead.motivo_cancelamento]}</p>}
        </div>
      </div>
      {lead.observacoes && <p className="text-gray-600 mt-1 line-clamp-1">{lead.observacoes}</p>}
    </div>
  );
}

function CanceladosCard({ leads }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-bold text-white">Recusaram / Não fecharam</p>
            <p className="text-xs text-gray-500">Sem porcentagem</p>
          </div>
        </div>
        <p className="text-3xl font-black text-red-400">{leads.length}</p>
      </div>
      <button onClick={() => setExpanded(!expanded)}
        className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-all">
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Ver lista ({leads.length})
      </button>
      {expanded && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          {leads.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Nenhum</p>}
          {leads.map(lead => <LeadMiniRow key={lead.id} lead={lead} />)}
        </div>
      )}
    </div>
  );
}

export default function CRMIndicadores({ leads, mesReferencia }) {
  const [meta, setMeta] = useState({ meta_prospeccao: 50, meta_reunioes: 50, meta_fechamentos: 10 });
  const [metaId, setMetaId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!mesReferencia) return;
    localApp.entities.CRMMeta.filter({ mes_referencia: mesReferencia }).then(res => {
      if (res.length > 0) { setMeta(res[0]); setMetaId(res[0].id); }
      else { setMeta({ meta_prospeccao: 50, meta_reunioes: 50, meta_fechamentos: 10 }); setMetaId(null); }
    });
  }, [mesReferencia]);

  const openEdit = (field, label, current) => {
    setEditField({ field, label });
    setEditValue(current);
    setEditOpen(true);
  };

  const saveMeta = async () => {
    const updated = { ...meta, [editField.field]: Number(editValue), mes_referencia: mesReferencia };
    if (metaId) {
      await localApp.entities.CRMMeta.update(metaId, updated);
    } else {
      const created = await localApp.entities.CRMMeta.create(updated);
      setMetaId(created.id);
    }
    setMeta(updated);
    setEditOpen(false);
  };

  const prospectados = leads.filter(l => ['prospeccao','reuniao_marcada','contrato','onboarding','cliente_ativo'].includes(l.status));
  const reunioes = leads.filter(l => ['reuniao_marcada','contrato','onboarding','cliente_ativo'].includes(l.status));
  const fechamentos = leads.filter(l => ['contrato','onboarding','cliente_ativo'].includes(l.status));
  const cancelados = leads.filter(l => l.status === 'cancelado');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetaCard icon={Users} label="Prospecção" meta={meta.meta_prospeccao} realizado={prospectados.length}
          color={{ text: 'text-blue-400', bg: 'bg-blue-400/10', bar: 'bg-blue-400' }}
          leads={prospectados}
          onEditMeta={() => openEdit('meta_prospeccao', 'Meta de prospecção', meta.meta_prospeccao)} />
        <MetaCard icon={CalendarCheck} label="Reuniões marcadas" meta={meta.meta_reunioes} realizado={reunioes.length}
          color={{ text: 'text-yellow-400', bg: 'bg-yellow-400/10', bar: 'bg-yellow-400' }}
          leads={reunioes}
          onEditMeta={() => openEdit('meta_reunioes', 'Meta de reuniões', meta.meta_reunioes)} />
        <MetaCard icon={FileSignature} label="Fechamentos" meta={meta.meta_fechamentos} realizado={fechamentos.length}
          color={{ text: 'text-green-400', bg: 'bg-green-400/10', bar: 'bg-green-400' }}
          leads={fechamentos}
          onEditMeta={() => openEdit('meta_fechamentos', 'Meta de fechamentos', meta.meta_fechamentos)} />
        <CanceladosCard leads={cancelados} />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 max-w-xs">
          <DialogHeader><DialogTitle>Editar {editField?.label}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">{editField?.label}</Label>
              <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                className="bg-[#1a1a2e] border-white/10 text-white" autoFocus />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setEditOpen(false)} className="flex-1 text-gray-400">Cancelar</Button>
              <Button onClick={saveMeta} className="flex-1 gradient-primary">Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}