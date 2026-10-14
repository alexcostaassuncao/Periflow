import React, { useState } from 'react';
import { localApp } from '@/api/localClient';
import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, XCircle, Calendar, FileText, FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import UserMentionInput from './UserMentionInput';

export default function ConversionModal({ event, onClose, onSave, clients }) {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState(event.conversion_status || 'pendente');
  const [notes, setNotes] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const user = await localApp.auth.me();
      const conversionData = {
        conversion_status: selectedStatus,
        conversion_notes: notes,
        converted_at: new Date().toISOString(),
        converted_by: user.email,
        conversion_history: [
          ...(event.conversion_history || []),
          {
            date: new Date().toISOString(),
            user_email: user.email,
            status: selectedStatus,
            notes
          }
        ]
      };

      await localApp.entities.CalendarEvent.update(event.id, conversionData);

      // Se fechado e tem prospect_name, criar notificação para converter em cliente
      if (selectedStatus === 'fechado' && event.prospect_name) {
        await localApp.entities.Notification.create({
          user_email: user.email,
          type: 'comercial',
          title: 'Reunião Convertida - Criar Cliente',
          message: `A reunião com ${event.prospect_name} foi marcada como fechada. Crie o cadastro do cliente para continuar.`,
          event_id: event.id
        });
      }

      // Notificar usuários mencionados
      if (mentionedUsers.length > 0) {
        await Promise.all(mentionedUsers.map(email =>
          localApp.entities.Notification.create({
            user_email: email,
            type: 'mencao',
            title: 'Você foi mencionado em uma conversão',
            message: `${user.full_name} mencionou você na conversão da reunião: ${event.title}`,
            event_id: event.id
          })
        ));
      }

      // Se em negociação e tem nova data, criar nova reunião
      if (selectedStatus === 'em_negociacao' && newMeetingDate) {
        await localApp.entities.CalendarEvent.create({
          title: `Follow-up: ${event.title}`,
          description: `Reunião de acompanhamento - ${notes}`,
          event_type: 'reuniao_comercial',
          start_datetime: newMeetingDate,
          client_id: event.client_id,
          prospect_name: event.prospect_name,
          participants: event.participants,
          meeting_link: event.meeting_link
        });

        await localApp.entities.Notification.create({
          user_email: user.email,
          type: 'reuniao',
          title: 'Nova Reunião Agendada',
          message: `Follow-up agendado para ${new Date(newMeetingDate).toLocaleString('pt-BR')}`,
          event_id: event.id
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar conversão:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClientFromProspect = () => {
    navigate(createPageUrl('Cadastros'), { 
      state: { 
        openClientForm: true, 
        prospectData: { 
          name: event.prospect_name,
          contact_name: event.prospect_name,
          notes: `Origem: Reunião comercial em ${new Date(event.start_datetime).toLocaleDateString('pt-BR')}`
        } 
      } 
    });
    onClose();
  };

  const convertToProposal = () => {
    navigate(createPageUrl('Comercial'), {
      state: {
        openProposalForm: true,
        eventData: event
      }
    });
    onClose();
  };

  const convertToContract = () => {
    navigate(createPageUrl('Comercial'), {
      state: {
        openContractForm: true,
        eventData: event
      }
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#12121a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[#ff5000]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold">🔄 Conversão da Reunião</h2>
            <p className="text-sm text-gray-400 mt-1">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="text-gray-400 text-sm mb-3 block font-medium">Resultado da Reunião *</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSelectedStatus('fechado')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedStatus === 'fechado'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/10 hover:border-green-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <div>
                    <h4 className="font-bold text-green-400">🟢 Fechado</h4>
                    <p className="text-xs text-gray-400 mt-1">Cliente fechou negócio</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedStatus('em_negociacao')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedStatus === 'em_negociacao'
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-white/10 hover:border-yellow-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h4 className="font-bold text-yellow-400">🟡 Em Negociação</h4>
                    <p className="text-xs text-gray-400 mt-1">Aguardando retorno / nova reunião</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedStatus('nao_avancou')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedStatus === 'nao_avancou'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-white/10 hover:border-red-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <h4 className="font-bold text-red-400">🔴 Não Avançou</h4>
                    <p className="text-xs text-gray-400 mt-1">Cliente não tem interesse</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {selectedStatus !== 'pendente' && (
            <>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Observações</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione detalhes sobre a conversão..."
                  className="bg-[#1a1a2e] border-white/10 min-h-[100px]"
                />
              </div>

              {selectedStatus === 'em_negociacao' && (
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Agendar Nova Reunião (Opcional)</label>
                  <Input
                    type="datetime-local"
                    value={newMeetingDate}
                    onChange={(e) => setNewMeetingDate(e.target.value)}
                    className="bg-[#1a1a2e] border-white/10"
                  />
                </div>
              )}

              <UserMentionInput
                selectedUsers={mentionedUsers}
                onChange={setMentionedUsers}
                label="Mencionar Participantes"
              />

              {selectedStatus === 'fechado' && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Próximos Passos
                  </h4>
                  <div className="space-y-2">
                    {event.prospect_name && !event.client_id && (
                      <Button
                        onClick={createClientFromProspect}
                        className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 justify-start"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Converter em Cliente
                      </Button>
                    )}
                    <Button
                      onClick={convertToProposal}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 justify-start"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Criar Orçamento
                    </Button>
                    <Button
                      onClick={convertToContract}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 justify-start"
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      Criar Contrato
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {event.conversion_history && event.conversion_history.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Histórico de Conversões</h4>
              <div className="space-y-2">
                {event.conversion_history.map((h, idx) => (
                  <div key={idx} className="p-3 bg-[#1a1a2e] rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${
                        h.status === 'fechado' ? 'text-green-400' :
                        h.status === 'em_negociacao' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {h.status === 'fechado' ? '🟢 Fechado' :
                         h.status === 'em_negociacao' ? '🟡 Em Negociação' :
                         '🔴 Não Avançou'}
                      </span>
                      <span className="text-gray-500">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {h.notes && <p className="text-gray-400">{h.notes}</p>}
                    <p className="text-gray-500 mt-1">Por: {h.user_email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedStatus === 'pendente' || loading}
            className="flex-1 gradient-primary"
          >
            {loading ? 'Salvando...' : 'Salvar Conversão'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}