import React, { useState } from 'react';

const MODELO_LABELS = {
  social_media: 'Social Media',
  trafego_pago: 'Tráfego Pago',
  pacote_completo: 'Pacote Completo',
};
import { motion } from 'framer-motion';
import { Phone, Building2, Tag, Calendar, Pencil, X, FileSignature, Users, CalendarCheck, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReuniaoModal from './ReuniaoModal';
import ContratoFormModal from './ContratoFormModal';
import EncerrarModal from './EncerrarModal';
import OnboardingModal from './OnboardingModal';
import LeadFormModal from './LeadFormModal';
import VoltarEtapaModal from './VoltarEtapaModal';

const STATUS_LABELS = {
  prospeccao: 'Em andamento',
  reuniao_marcada: 'Reunião marcada',
  contrato: 'Contrato',
  onboarding: 'Onboarding',
  cliente_ativo: 'Cliente ativo',
  cancelado: 'Cancelado',
};

const MOTIVO_LABELS = {
  sem_retorno: 'Sem retorno', valor_alto: 'Valor alto', fechou_concorrente: 'Fechou c/ concorrente',
  desistiu: 'Desistiu', cancelado: 'Cancelado', outro: 'Outro',
};

export default function LeadCard({ lead, onRefresh, delay = 0 }) {
  const [showReuniao, setShowReuniao] = useState(false);
  const [showContrato, setShowContrato] = useState(false);
  const [showEncerrar, setShowEncerrar] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showVoltar, setShowVoltar] = useState(false);

  const ETAPAS_ANTERIORES = {
    reuniao_marcada: true,
    contrato: true,
    onboarding: true,
    cliente_ativo: true,
  };
  const podeVoltar = !!ETAPAS_ANTERIORES[lead.status];

  const checklist = lead.checklist_onboarding || {};
  const checkDone = Object.values(checklist).filter(Boolean).length;
  const checkTotal = 7;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="glass-card rounded-xl p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{lead.nome_contato}</p>
            <p className="text-sm text-gray-400 flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 flex-shrink-0" />{lead.nome_empresa}
            </p>
          </div>
          <button onClick={() => setShowEdit(true)} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-all flex-shrink-0">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {lead.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.telefone}</span>}
          {lead.segmento && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{lead.segmento}</span>}
          {lead.data_reuniao && (
            <span className="flex items-center gap-1 text-blue-400">
              <Calendar className="w-3 h-3" />
              {format(new Date(lead.data_reuniao), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>

        {lead.observacoes && (
          <p className="text-xs text-gray-500 bg-white/3 rounded-lg px-3 py-2 line-clamp-2">{lead.observacoes}</p>
        )}

        {/* Onboarding progress */}
        {(lead.status === 'onboarding' || lead.status === 'contrato') && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Onboarding</span><span>{checkDone}/{checkTotal}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(checkDone / checkTotal) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Cancelado info */}
        {lead.status === 'cancelado' && lead.motivo_cancelamento && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            {MOTIVO_LABELS[lead.motivo_cancelamento]}
            {lead.observacoes_cancelamento && ` — ${lead.observacoes_cancelamento}`}
          </p>
        )}

        {/* Contrato info */}
        {lead.dados_contrato?.valor_mensal && (
          <div className="space-y-1">
            <p className="text-xs text-green-400">
              R$ {Number(lead.dados_contrato.valor_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
              {lead.dados_contrato.modelo_contrato && ` · ${MODELO_LABELS[lead.dados_contrato.modelo_contrato] || lead.dados_contrato.modelo_contrato}`}
            </p>
            {lead.dados_contrato?.status_assinatura && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                lead.dados_contrato.status_assinatura === 'contrato_assinado'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {lead.dados_contrato.status_assinatura === 'contrato_assinado' ? 'Contrato assinado' : 'Aguardando assinatura'}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {lead.status === 'prospeccao' && (
            <>
              <button onClick={() => setShowReuniao(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-all">
                <CalendarCheck className="w-3 h-3" />Marcar reunião
              </button>
              <button onClick={() => setShowEncerrar(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                <X className="w-3 h-3" />Encerrar
              </button>
            </>
          )}
          {lead.status === 'reuniao_marcada' && (
            <>
              <button onClick={() => setShowContrato(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all">
                <FileSignature className="w-3 h-3" />Gerar contrato
              </button>
              <button onClick={() => setShowReuniao(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
                <Calendar className="w-3 h-3" />Reagendar
              </button>
              <button onClick={() => setShowEncerrar(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                <X className="w-3 h-3" />Encerrar
              </button>
            </>
          )}
          {lead.status === 'contrato' && (
            <>
              <button onClick={() => setShowContrato(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all">
                <FileSignature className="w-3 h-3" />Editar contrato
              </button>
              <button onClick={() => setShowOnboarding(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-all">
                <Users className="w-3 h-3" />Onboarding
              </button>
            </>
          )}
          {lead.status === 'onboarding' && (
            <button onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-all">
              <Users className="w-3 h-3" />Ver onboarding
            </button>
          )}
          {podeVoltar && (
            <button onClick={() => setShowVoltar(true)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all">
              <ArrowLeft className="w-3 h-3" />Voltar etapa
            </button>
          )}
        </div>
      </motion.div>

      {showEdit && <LeadFormModal open={showEdit} onClose={() => setShowEdit(false)} lead={lead} onSaved={onRefresh} />}
      {showReuniao && <ReuniaoModal open={showReuniao} onClose={() => setShowReuniao(false)} lead={lead} onSaved={onRefresh} />}
      {showContrato && <ContratoFormModal open={showContrato} onClose={() => setShowContrato(false)} lead={lead} onSaved={onRefresh} />}
      {showEncerrar && <EncerrarModal open={showEncerrar} onClose={() => setShowEncerrar(false)} lead={lead} onSaved={onRefresh} />}
      {showOnboarding && <OnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} lead={lead} onSaved={onRefresh} />}
      {showVoltar && <VoltarEtapaModal open={showVoltar} onClose={() => setShowVoltar(false)} lead={lead} onSaved={onRefresh} />}
    </>
  );
}