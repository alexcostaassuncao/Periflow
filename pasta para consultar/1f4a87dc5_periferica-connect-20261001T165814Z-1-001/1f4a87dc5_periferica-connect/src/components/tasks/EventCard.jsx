import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Play, 
  Pause, 
  StopCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const eventFormFields = {
  briefing: [
    { id: 'objetivo', label: 'Objetivo do Conteúdo', type: 'textarea', required: true },
    { id: 'tipo_entrega', label: 'Tipo de Entrega', type: 'select', required: true, options: ['Post', 'Campanha', 'Vídeo', 'Stories'] },
    { id: 'referencias', label: 'Referências e Links', type: 'textarea', required: false },
    { id: 'plataformas', label: 'Plataformas', type: 'multiselect', required: true, options: ['Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'TikTok'] }
  ],
  redacao: [
    { id: 'direcionamento_criativo', label: 'Direcionamento Criativo (Ideia/Linha Criativa)', type: 'textarea', required: true },
    { id: 'legenda_post', label: 'Legenda do Post', type: 'textarea', required: true },
    { id: 'arquivos_anexos', label: 'Arquivos Anexos', type: 'file', required: false }
  ],
  design: [
    { id: 'arquivo_final', label: 'Arte/Vídeo Final', type: 'file', required: true },
    { id: 'observacoes', label: 'Observações', type: 'textarea', required: false }
  ],
  aprovacao_cliente: [
    { id: 'status_aprovacao', label: 'Status da Aprovação', type: 'select', required: true, options: ['Aprovado', 'Ajustes Solicitados', 'Reprovado'] },
    { id: 'comentarios_cliente', label: 'Comentários do Cliente', type: 'textarea', required: false },
    { id: 'ajustes_solicitados', label: 'Ajustes Solicitados', type: 'textarea', required: false }
  ],
  publicacao: [
    { id: 'canal', label: 'Canal de Publicação', type: 'select', required: true, options: ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Twitter', 'YouTube'] },
    { id: 'tipo_post', label: 'Tipo de Post', type: 'select', required: true, options: ['Feed', 'Stories', 'Reels', 'Carrossel'] },
    { id: 'data_publicacao', label: 'Data de Publicação', type: 'date', required: true },
    { id: 'hora_publicacao', label: 'Hora de Publicação', type: 'time', required: true },
    { id: 'link_publicacao', label: 'Link da Publicação', type: 'text', required: false }
  ],
  monitoramento: [
    { id: 'metricas_iniciais', label: 'Métricas Iniciais', type: 'textarea', required: false },
    { id: 'observacoes_gestor', label: 'Observações do Gestor', type: 'textarea', required: false },
    { id: 'ocorrencias', label: 'Ocorrências (erros, ajustes)', type: 'textarea', required: false },
    { id: 'avaliacao_final', label: 'Avaliação Final', type: 'select', required: false, options: ['Excelente', 'Bom', 'Regular', 'Precisa Melhorar'] }
  ]
};

const defaultChecklists = {
  briefing: [
    { text: 'Informações básicas preenchidas', required: true },
    { text: 'Referências anexadas', required: false }
  ],
  redacao: [
    { text: 'Ler briefing', required: true },
    { text: 'Criar primeira versão do texto', required: true },
    { text: 'Revisar ortografia', required: true },
    { text: 'Ajustar CTA', required: true }
  ],
  design: [
    { text: 'Criar layout', required: true },
    { text: 'Aplicar identidade visual', required: true },
    { text: 'Ajustar formatos', required: true },
    { text: 'Exportar arquivo final', required: true }
  ],
  aprovacao_cliente: [
    { text: 'Enviar para cliente', required: true },
    { text: 'Aguardar retorno', required: true },
    { text: 'Aplicar ajustes (se necessário)', required: false }
  ],
  publicacao: [
    { text: 'Programar publicação', required: true },
    { text: 'Verificar horário', required: true },
    { text: 'Confirmar publicação', required: true }
  ],
  monitoramento: [
    { text: 'Verificar métricas iniciais', required: false },
    { text: 'Identificar problemas', required: false },
    { text: 'Documentar resultados', required: false }
  ]
};

export default function EventCard({ event, eventIndex, isActive, isBlocked, onUpdate, onStart, onComplete, taskId }) {
  const [expanded, setExpanded] = useState(isActive);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(event.time_spent || 0);
  const [formData, setFormData] = useState(event.form_data || {});
  const [checklist, setChecklist] = useState(
    event.checklist || defaultChecklists[event.event_type]?.map((item, idx) => ({
      id: idx.toString(),
      ...item,
      completed: false
    })) || []
  );

  useEffect(() => {
    setExpanded(isActive);
  }, [isActive]);

  useEffect(() => {
    let interval;
    if (timerRunning && event.uses_timer) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 60000); // 1 minuto
    }
    return () => clearInterval(interval);
  }, [timerRunning, event.uses_timer]);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleStartTimer = () => {
    setTimerRunning(true);
    if (event.status === 'pending') {
      onStart(eventIndex);
    }
  };

  const handlePauseTimer = () => {
    setTimerRunning(false);
    onUpdate(eventIndex, { time_spent: elapsedTime });
  };

  const handleChecklistToggle = (itemId) => {
    const updated = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    onUpdate(eventIndex, { checklist: updated });
  };

  const handleFormChange = (fieldId, value) => {
    const updated = { ...formData, [fieldId]: value };
    setFormData(updated);
  };

  const canComplete = () => {
    // Verificar campos obrigatórios do formulário
    const fields = eventFormFields[event.event_type] || [];
    const requiredFieldsFilled = fields
      .filter(field => field.required)
      .every(field => formData[field.id] && formData[field.id].toString().trim() !== '');

    return requiredFieldsFilled;
  };

  const handleComplete = () => {
    if (!canComplete()) {
      alert('Complete todos os itens obrigatórios antes de finalizar esta etapa');
      return;
    }
    
    onComplete(eventIndex, {
      form_data: formData,
      checklist: checklist,
      time_spent: elapsedTime,
      completed_at: new Date().toISOString()
    });
  };

  const statusColors = {
    pending: 'border-gray-500/30 bg-gray-500/5',
    in_progress: 'border-blue-500/30 bg-blue-500/5',
    completed: 'border-green-500/30 bg-green-500/5',
    blocked: 'border-red-500/30 bg-red-500/5'
  };

  const statusIcons = {
    pending: Circle,
    in_progress: Clock,
    completed: CheckCircle,
    blocked: Lock
  };

  const StatusIcon = statusIcons[event.status] || Circle;

  return (
    <motion.div
      layout
      className={`rounded-xl border-2 ${statusColors[event.status]} transition-all ${
        isActive ? 'shadow-lg' : ''
      }`}
    >
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => !isBlocked && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {event.executor_email && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-bold">
              {event.executor_email.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="font-semibold">{event.name}</h4>
            {event.executor_email && (
              <p className="text-sm text-gray-400">{event.executor_email.split('@')[0]}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <StatusIcon className={`w-4 h-4 ${
                event.status === 'completed' ? 'text-green-400' :
                event.status === 'in_progress' ? 'text-blue-400' :
                event.status === 'blocked' ? 'text-red-400' :
                'text-gray-400'
              }`} />
              {event.uses_timer && (
                <>
                  <span>•</span>
                  <span className="text-[#ff5000]">⏱️ {formatTime(elapsedTime)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isBlocked && <Lock className="w-4 h-4 text-red-400" />}
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && !isBlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 p-4 space-y-4"
          >
            {/* Timer Controls */}
            {event.uses_timer && event.status !== 'completed' && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e]">
                <Clock className="w-5 h-5 text-[#ff5000]" />
                <span className="font-medium flex-1">Cronômetro: {formatTime(elapsedTime)}</span>
                {!timerRunning ? (
                  <Button size="sm" onClick={handleStartTimer} className="gradient-primary">
                    <Play className="w-4 h-4 mr-1" /> Iniciar
                  </Button>
                ) : (
                  <Button size="sm" onClick={handlePauseTimer} variant="outline">
                    <Pause className="w-4 h-4 mr-1" /> Pausar
                  </Button>
                )}
              </div>
            )}



            {/* Form Fields */}
            {eventFormFields[event.event_type] && (
              <div>
                <Label className="text-gray-400 mb-3 block">Formulário da Etapa</Label>
                <div className="space-y-3">
                  {eventFormFields[event.event_type].map((field) => (
                    <div key={field.id}>
                      <Label className="text-gray-300 text-sm mb-1 block">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          value={formData[field.id] || ''}
                          onChange={(e) => handleFormChange(field.id, e.target.value)}
                          className="bg-[#12121a] border-white/10"
                          disabled={event.status === 'completed'}
                        />
                      ) : field.type === 'select' ? (
                        <Select
                          value={formData[field.id] || ''}
                          onValueChange={(v) => handleFormChange(field.id, v)}
                          disabled={event.status === 'completed'}
                        >
                          <SelectTrigger className="bg-[#12121a] border-white/10">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-white/10">
                            {field.options?.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          value={formData[field.id] || ''}
                          onChange={(e) => handleFormChange(field.id, e.target.value)}
                          className="bg-[#12121a] border-white/10"
                          disabled={event.status === 'completed'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {event.status !== 'completed' && (
              <div className="flex gap-3 pt-3 border-t border-white/10">
                {event.status === 'pending' && (
                  <Button onClick={() => onStart(eventIndex)} className="flex-1 gradient-primary">
                    Iniciar Etapa
                  </Button>
                )}
                {event.status === 'in_progress' && (
                  <Button 
                    onClick={handleComplete} 
                    disabled={!canComplete()}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluir Etapa
                  </Button>
                )}
              </div>
            )}

            {event.status === 'completed' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                ✓ Etapa concluída em {new Date(event.completed_at).toLocaleString('pt-BR')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}