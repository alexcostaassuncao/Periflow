import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  User,
  Tag,
  CheckSquare,
  Zap,
  FileText,
  Building2,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { localApp } from '@/api/localClient';

const taskTypes = [
  { value: 'criacao', label: 'Criação' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'aprovacao', label: 'Aprovação' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'outros', label: 'Outros' }
];

const priorities = [
  { value: 'baixa', label: 'Baixa', color: 'text-green-400' },
  { value: 'media', label: 'Média', color: 'text-yellow-400' },
  { value: 'alta', label: 'Alta', color: 'text-red-400' }
];

const statuses = [
  { value: 'a_fazer', label: 'A Fazer' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'em_revisao', label: 'Em Revisão' },
  { value: 'aguardando_aprovacao', label: 'Aguardando Aprovação' },
  { value: 'concluida', label: 'Concluída' }
];

const defaultEvents = [
  { name: 'Briefing',          event_type: 'briefing',           role: 'consultor',   duration_days: 0,  estimated_time: 30,  uses_timer: false },
  { name: 'Captação',          event_type: 'captacao',            role: 'videomaker',  duration_days: 1,  estimated_time: 60,  uses_timer: true  },
  { name: 'Videomaker',        event_type: 'videomaker',          role: 'video_maker', duration_days: 2,  estimated_time: 120, uses_timer: true  },
  { name: 'Design',            event_type: 'design',              role: 'designer',    duration_days: 3,  estimated_time: 60,  uses_timer: true  },
  { name: 'Redação',           event_type: 'redacao',             role: 'copy',        duration_days: 2,  estimated_time: 30,  uses_timer: true  },
  { name: 'Revisão',           event_type: 'revisao',             role: 'consultor',   duration_days: 1,  estimated_time: 30,  uses_timer: false },
  { name: 'Aprovação Cliente', event_type: 'aprovacao_cliente',   role: 'consultor',   duration_days: 1,  estimated_time: 30,  uses_timer: false },
  { name: 'Publicação Orgânica', event_type: 'publicacao_organica', role: 'consultor', duration_days: 1,  estimated_time: 30,  uses_timer: false },
];

export default function TaskModal({ 
  isOpen, 
  onClose, 
  task, 
  onSave, 
  employees,
  templates,
  currentUserEmail,
  initialClient,
  initialPlan,
}) {
  const [clients, setClients] = React.useState([]);
  const [projectTemplates, setProjectTemplates] = React.useState([]);
  const [allEmployees, setAllEmployees] = React.useState([]);
  const [step, setStep] = useState(1); // 1: Cliente, 2: Modelo, 3: Detalhes
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [isMultipleCreation, setIsMultipleCreation] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    status: 'a_fazer',
    responsible_email: currentUserEmail || '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(), 'yyyy-MM-dd'),
    client_id: '',
    client_name: '',
    plan_id: '',
    delivery_type: 'arte',
    squad_id: '',
    events: defaultEvents.map((evt, idx) => ({
      id: idx.toString(),
      ...evt,
      status: idx === 0 ? 'pending' : 'blocked',
      time_spent: 0,
      executor_email: currentUserEmail || '',
      form_data: {}
    })),
    current_event_index: 0,
    xp_reward: 0,
    xp_concedido: false,
    ajustes: []
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [activeEventTimer, setActiveEventTimer] = useState(null);

  React.useEffect(() => {
    loadClients();
    loadProjectTemplates();
    loadAllEmployees();
  }, []);

  const loadClients = async () => {
    const clientsData = await localApp.entities.Client.filter({ status: 'ativo' });
    setClients(clientsData);
  };

  const loadProjectTemplates = async () => {
    const templatesData = await localApp.entities.ProjectTemplate.filter({ status: 'ativo' });
    setProjectTemplates(templatesData);
  };

  const loadAllEmployees = async () => {
    const [empsData, usersData] = await Promise.all([
      localApp.entities.Employee.list(),
      localApp.entities.User.list()
    ]);
    const merged = empsData.map(emp => {
      const u = usersData.find(u => u.id === emp.user_id);
      return { ...emp, email: u?.email, full_name: u?.full_name, role_label: emp.position };
    });
    setAllEmployees(merged);
  };

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        delivery_type: task.delivery_type || 'arte',
        start_date: task.start_date || format(new Date(), 'yyyy-MM-dd'),
        due_date: task.due_date || format(new Date(), 'yyyy-MM-dd'),
        checklist: task.checklist || [],
        events: task.events || defaultEvents.map((evt, idx) => ({
          id: idx.toString(),
          ...evt,
          status: idx === 0 ? 'pending' : 'blocked',
          time_spent: 0,
          executor_email: currentUserEmail || '',
          checklist: [],
          form_data: {}
        })),
        current_event_index: task.current_event_index || 0,
        form_data: task.form_data || {}
      });
    } else {
      setFormData(prev => ({
        ...prev,
        responsible_email: currentUserEmail || '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(), 'yyyy-MM-dd')
      }));
    }
  }, [task, currentUserEmail]);

  useEffect(() => {
    if (!isOpen || task) return;
    if (!initialClient) {
      setSelectedClient(null);
      setStep(1);
      return;
    }

    setSelectedClient(initialClient);
    setStep(2);
    localApp.entities.Squad.list().then(squads => {
      const squad = squads.find(item => item.clients?.includes(initialClient.id));
      setFormData(prev => ({
        ...prev,
        client_id: initialClient.id,
        client_name: initialClient.name,
        plan_id: initialPlan?.id || '',
        squad_id: squad?.id || prev.squad_id,
      }));
    });
  }, [isOpen, task, initialClient, initialPlan]);

  // Retorna o email do primeiro funcionário com determinado papel
  const getEmailByRole = (roleKeyword) => {
    const emp = allEmployees.find(e => 
      e.position?.toLowerCase().includes(roleKeyword) ||
      e.carteira === roleKeyword
    );
    return emp?.email || currentUserEmail || '';
  };

  const buildDefaultEventsWithRoles = () => {
    return defaultEvents.map((evt, idx) => {
      let executorEmail = currentUserEmail || '';
      if (evt.role === 'videomaker' || evt.role === 'video_maker') {
        executorEmail = getEmailByRole('video') || currentUserEmail || '';
      } else if (evt.role === 'designer') {
        executorEmail = getEmailByRole('design') || currentUserEmail || '';
      } else if (evt.role === 'copy') {
        executorEmail = getEmailByRole('copy') || getEmailByRole('redator') || currentUserEmail || '';
      }
      return {
        id: idx.toString(),
        ...evt,
        status: idx === 0 ? 'pending' : 'blocked',
        time_spent: 0,
        executor_email: executorEmail,
        form_data: {}
      };
    });
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    // Descobrir squad_id pelo client — squad que tem o cliente na lista de clients
    localApp.entities.Squad.list().then(squads => {
      const squad = squads.find(s => s.clients?.includes(client.id));
      setFormData(prev => ({
        ...prev,
        client_id: client.id,
        client_name: client.name,
        squad_id: squad?.id || prev.squad_id,
        events: buildDefaultEventsWithRoles()
      }));
    });
    setStep(2);
  };

  const handleTemplateSelect = (template, isMultiple) => {
    setSelectedTemplate(template);
    setIsMultipleCreation(isMultiple);
    
    if (!isMultiple) {
      // Post único - preenche dados e vai para step 3
      setFormData(prev => ({
        ...prev,
        title: template?.name || 'Post Único',
        xp_reward: template?.tasks?.[0]?.xp_reward || 0
      }));
      setStep(3);
    } else {
      // Modelo múltiplo - cria todas as tarefas de uma vez
      handleMultipleTaskCreation(template);
    }
  };

  const handleMultipleTaskCreation = async (template) => {
    if (!template.tasks || template.tasks.length === 0) {
      alert('Este modelo não possui tarefas configuradas');
      return;
    }

    // Cria múltiplas tarefas baseado no modelo
    const tasksToCreate = [];
    
    template.tasks.forEach(taskTemplate => {
      for (let i = 0; i < (taskTemplate.quantity || 1); i++) {
        tasksToCreate.push({
          title: `${taskTemplate.name} ${i + 1}/${taskTemplate.quantity || 1}`,
          description: template.description || '',
          priority: taskTemplate.priority || 'media',
          status: 'a_fazer',
          responsible_email: currentUserEmail || '',
          start_date: format(new Date(), 'yyyy-MM-dd'),
          due_date: format(new Date(), 'yyyy-MM-dd'),
          client_id: selectedClient.id,
          client_name: selectedClient.name,
          plan_id: initialPlan?.id || formData.plan_id,
          template_id: template.id,
          delivery_type: formData.delivery_type,
          events: defaultEvents.map((evt, idx) => ({
            id: idx.toString(),
            ...evt,
            status: idx === 0 ? 'pending' : 'blocked',
            time_spent: 0,
            executor_email: currentUserEmail || '',
            form_data: {}
          })),
          current_event_index: 0,
          xp_reward: taskTemplate.xp_reward || 0,
          xp_concedido: false,
          ajustes: []
        });
      }
    });

    // Salva todas as tarefas
    for (const taskData of tasksToCreate) {
      await localApp.entities.Task.create(taskData);
    }

    alert(`✅ ${tasksToCreate.length} tarefas criadas com sucesso!`);
    onClose();
    window.location.reload();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData(prev => ({
        ...prev,
        checklist: [
          ...prev.checklist,
          { id: Date.now().toString(), text: newChecklistItem, completed: false, required: false }
        ]
      }));
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const toggleChecklistItem = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const applyTemplate = (templateId) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.name,
        description: template.description || '',
        task_type: template.task_type,
        priority: template.default_priority || 'media',
        checklist: template.default_checklist?.map((item, idx) => ({
          id: idx.toString(),
          text: item.text,
          completed: false,
          required: item.required
        })) || [],
        events: template.default_events?.map((evt, idx) => ({
          id: idx.toString(),
          ...evt,
          status: idx === 0 ? 'pending' : 'blocked',
          time_spent: 0,
          executor_email: currentUserEmail || '',
          checklist: [],
          form_data: {}
        })) || formData.events,
        current_event_index: 0,
        xp_reward: template.default_xp || 50
      }));
    }
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: client?.name || ''
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
            <h2 className="text-xl font-bold">
              {task ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Step 1: Selecionar Cliente */}
            {!task && step === 1 && (
              <div>
                <h3 className="text-lg font-bold mb-4">Selecione o Cliente</h3>
                <div className="grid grid-cols-2 gap-3">
                  {clients.map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleClientSelect(client)}
                      className="p-4 rounded-xl bg-[#1a1a2e] hover:bg-[#ff5000]/20 border border-white/10 hover:border-[#ff5000] transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#ff5000]/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#ff5000]" />
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-gray-400">{client.segment || 'Cliente'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Selecionar Modelo */}
            {!task && step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Escolha o Tipo de Tarefa</h3>
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    ← Voltar
                  </Button>
                </div>

                {initialPlan && (
                  <div className="mb-4 rounded-lg border border-[#ff5000]/20 bg-[#ff5000]/5 px-4 py-3 text-sm">
                    <p className="font-medium">Plano: {initialPlan.name}</p>
                    <p className="mt-1 text-xs text-gray-400">Tarefa vinculada a {selectedClient?.name}</p>
                  </div>
                )}

                <div className="mb-4 max-w-xs">
                  <Label className="mb-2 block text-gray-400">Tipo de entrega</Label>
                  <Select value={formData.delivery_type} onValueChange={value => setFormData(prev => ({ ...prev, delivery_type: value }))}>
                    <SelectTrigger className="bg-[#1a1a2e] border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="arte">Arte</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-4">
                  <Input
                    placeholder="🔍 Buscar modelo..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="bg-[#1a1a2e] border-white/10"
                  />
                </div>

                <div className="space-y-4">
                  {/* Post Único */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Post Único / Extra</p>
                    <button
                      type="button"
                      onClick={() => handleTemplateSelect(null, false)}
                      className="w-full p-4 rounded-xl bg-[#1a1a2e] hover:bg-[#ff5000]/20 border border-white/10 hover:border-[#ff5000] transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Post Único / Extra</p>
                          <p className="text-xs text-gray-400">Criar apenas 1 tarefa</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Modelos de Projeto */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Modelos de Projeto</p>
                    <div className="grid grid-cols-2 gap-3">
                      {projectTemplates
                        .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()))
                        .map(template => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleTemplateSelect(template, true)}
                            className="p-4 rounded-xl bg-[#1a1a2e] hover:bg-[#ff5000]/20 border border-white/10 hover:border-[#ff5000] transition-all text-left"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-purple-400" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{template.name}</p>
                                <p className="text-xs text-gray-400">
                                  {template.tasks?.reduce((sum, t) => sum + (t.quantity || 1), 0) || 0} tarefas
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Detalhes da Tarefa (apenas para post único) */}
            {!task && step === 3 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Detalhes da Tarefa</h3>
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    ← Voltar
                  </Button>
                </div>

                {/* Title */}
                <div>
                  <Label className="text-gray-400 mb-2 block">Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome da tarefa"
                    className="bg-[#1a1a2e] border-white/10"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-gray-400 mb-2 block">Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva a tarefa..."
                    className="bg-[#1a1a2e] border-white/10 min-h-[100px]"
                  />
                </div>

                {/* Priority Only */}
                <div>
                  <Label className="mb-2 block text-gray-400">Tipo de entrega</Label>
                  <Select value={formData.delivery_type} onValueChange={value => setFormData(prev => ({ ...prev, delivery_type: value }))}>
                    <SelectTrigger className="bg-[#1a1a2e] border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="arte">Arte</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Only */}
                <div>
                  <Label className="text-gray-400 mb-2 block">Prioridade *</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                  >
                    <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {priorities.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className={p.color}>{p.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">ℹ️ O tipo da tarefa é definido pelos formulários criados</p>
                </div>

                {/* Status and Responsible */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 mb-2 block">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        {statuses.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-400 mb-2 block">Responsável</Label>
                    <Select 
                      value={formData.responsible_email} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, responsible_email: v }))}
                    >
                      <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        {employees?.map(emp => (
                          <SelectItem key={emp.id} value={emp.created_by}>
                            {emp.created_by}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 mb-2 block">Data Início</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="bg-[#1a1a2e] border-white/10"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 mb-2 block">Data Entrega *</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="bg-[#1a1a2e] border-white/10"
                      required
                    />
                  </div>
                </div>

                {/* Cliente (readonly se veio do step anterior) */}
                {selectedClient && (
                  <div>
                    <Label className="text-gray-400 mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Cliente
                    </Label>
                    <div className="p-3 rounded-lg bg-[#1a1a2e] border border-white/10">
                      <p className="font-medium">{selectedClient.name}</p>
                    </div>
                  </div>
                )}

                {/* XP Reward - Admin Only */}
                <div>
                  <Label className="text-gray-400 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#ff5000]" /> XP da Tarefa
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData(prev => ({ ...prev, xp_reward: parseInt(e.target.value) }))}
                    className="bg-[#1a1a2e] border-white/10"
                  />
                  <p className="text-xs text-gray-500 mt-1">⚠️ XP só é concedido quando TODOS os formulários da tarefa forem concluídos</p>
                </div>

                {/* Events/Etapas - Preview com responsáveis */}
                <div>
                  <Label className="text-gray-400 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Etapas da Tarefa
                  </Label>
                  <div className="rounded-lg bg-[#1a1a2e] border border-white/10 divide-y divide-white/5">
                    {formData.events?.map((evt, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-gray-400">{idx + 1}</span>
                          <span className="text-sm font-medium">{evt.name}</span>
                          {evt.role && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff5000]/20 text-[#ff5000]">{evt.role}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={evt.executor_email || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                events: prev.events.map((ev, i) => i === idx ? { ...ev, executor_email: val } : ev)
                              }));
                            }}
                            className="text-xs bg-[#12121a] border border-white/10 rounded px-2 py-1 text-white max-w-[160px]"
                          >
                            <option value="">Selecionar...</option>
                            {allEmployees.filter(e => e.email).map(emp => (
                              <option key={emp.id} value={emp.email}>{emp.full_name || emp.email}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Editing existing task */}
            {task && (
              <>
                <div>
                  <Label className="text-gray-400 mb-2 block">Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome da tarefa"
                    className="bg-[#1a1a2e] border-white/10"
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-400 mb-2 block">Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva a tarefa..."
                    className="bg-[#1a1a2e] border-white/10 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 mb-2 block">Prioridade *</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                  >
                    <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {priorities.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className={p.color}>{p.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 mb-2 block">Data Entrega *</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="bg-[#1a1a2e] border-white/10"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 mb-2 block">Responsável</Label>
                    <Select 
                      value={formData.responsible_email} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, responsible_email: v }))}
                    >
                      <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        {employees?.filter(emp => emp.created_by).map(emp => (
                          <SelectItem key={emp.id} value={emp.created_by}>
                            {emp.full_name || emp.created_by}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </form>

          <div className="flex gap-3 p-6 border-t border-white/10">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1 gradient-primary hover:opacity-90">
              {task ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}