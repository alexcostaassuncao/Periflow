import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Tag, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import MonitoramentoTab from '../components/tasks/MonitoramentoTab';
import EventTimeline from '../components/tasks/EventTimeline';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EventCard from '../components/tasks/EventCard';
import PostFormEditor from '../components/post/PostFormEditor';
import FormularioEditor from '../components/forms/FormularioEditor';
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Trash2 } from 'lucide-react';

export default function TaskDetail() {
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('formularios');
  const [ajusteComment, setAjusteComment] = useState('');
  const [ajusteFiles, setAjusteFiles] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [editingFormulario, setEditingFormulario] = useState(null);
  const [showFormularioModal, setShowFormularioModal] = useState(false);
  const [modelosDisponiveis, setModelosDisponiveis] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');

  useEffect(() => {
    loadData();
    loadFormularios();
  }, [taskId]);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);

      if (taskId) {
        const taskData = await localApp.entities.Task.filter({ id: taskId });
        if (taskData.length > 0) {
          setTask(taskData[0]);
        }
      }
    } catch (error) {
      console.log('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormularios = async () => {
    if (!taskId) return;
    const forms = await localApp.entities.FormularioTarefa.filter({ task_id: taskId });
    setFormularios(forms);
  };

  const handleNovoFormulario = async (tipo) => {
    const novoFormulario = await localApp.entities.FormularioTarefa.create({
      task_id: taskId,
      tipo,
      nome_formulario: `${tipo} - ${new Date().toLocaleDateString('pt-BR')}`,
      briefing: {},
      criacao: {},
      historico: [],
      status: 'rascunho'
    });
    setFormularios(prev => [...prev, novoFormulario]);
    setEditingFormulario(novoFormulario);
    setShowFormularioModal(true);
  };

  const handleSaveFormulario = async (updated) => {
    await localApp.entities.FormularioTarefa.update(updated.id, updated);
    setFormularios(prev => prev.map(f => f.id === updated.id ? updated : f));
    setShowFormularioModal(false);
    setEditingFormulario(null);
  };

  const handleDeleteFormulario = async (id) => {
    if (confirm('Deseja excluir este formulário?')) {
      await localApp.entities.FormularioTarefa.delete(id);
      setFormularios(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleEventUpdate = async (eventIndex, updates) => {
    const updatedEvents = [...task.events];
    updatedEvents[eventIndex] = { ...updatedEvents[eventIndex], ...updates };

    await localApp.entities.Task.update(task.id, { events: updatedEvents });
    setTask(prev => ({ ...prev, events: updatedEvents }));
  };

  const handleEventStart = async (eventIndex) => {
    const updatedEvents = [...task.events];
    updatedEvents[eventIndex].status = 'in_progress';
    updatedEvents[eventIndex].start_date = new Date().toISOString();

    await localApp.entities.Task.update(task.id, { 
      events: updatedEvents,
      current_event_index: eventIndex,
      status: 'em_andamento'
    });
    setTask(prev => ({ ...prev, events: updatedEvents, current_event_index: eventIndex, status: 'em_andamento' }));
  };

  const handleEventComplete = async (eventIndex, eventData) => {
    const updatedEvents = [...task.events];
    updatedEvents[eventIndex] = {
      ...updatedEvents[eventIndex],
      ...eventData,
      status: 'completed'
    };

    const nextEventIndex = eventIndex + 1;
    if (nextEventIndex < updatedEvents.length) {
      updatedEvents[nextEventIndex].status = 'pending';
    }

    const allCompleted = updatedEvents.every(e => e.status === 'completed');

    await localApp.entities.Task.update(task.id, {
      events: updatedEvents,
      current_event_index: nextEventIndex,
      status: allCompleted ? 'em_revisao' : 'em_andamento'
    });

    setTask(prev => ({
      ...prev,
      events: updatedEvents,
      current_event_index: nextEventIndex,
      status: allCompleted ? 'em_revisao' : 'em_andamento'
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploads = await Promise.all(
      files.map(file => localApp.integrations.Core.UploadFile({ file }))
    );
    setAjusteFiles(prev => [...prev, ...uploads.map(u => u.file_url)]);
  };

  const handleSaveAjuste = async () => {
    const ajusteData = {
      comment: ajusteComment,
      files: ajusteFiles,
      created_at: new Date().toISOString(),
      created_by: user.email
    };

    const currentAjustes = task.ajustes || [];
    await localApp.entities.Task.update(task.id, {
      ajustes: [...currentAjustes, ajusteData]
    });

    setTask(prev => ({ ...prev, ajustes: [...currentAjustes, ajusteData] }));
    setAjusteComment('');
    setAjusteFiles([]);
  };

  const handleFinalizeTask = async () => {
    // Verifica se TODOS os formulários foram concluídos
    const todosFormulariosConcluidos = formularios.every(f => f.status === 'aprovado');
    
    if (!todosFormulariosConcluidos) {
      alert('⚠️ XP só será concedido quando TODOS os formulários da tarefa forem concluídos!');
      return;
    }

    // Concede XP apenas se não foi concedido antes
    if (!task.xp_concedido && task.xp_reward > 0) {
      const employee = await localApp.entities.Employee.filter({ user_id: user.id });
      if (employee.length > 0) {
        const emp = employee[0];
        await localApp.entities.Employee.update(emp.id, {
          xp_total: (emp.xp_total || 0) + task.xp_reward,
          tasks_completed: (emp.tasks_completed || 0) + 1
        });
      }
    }

    await localApp.entities.Task.update(task.id, {
      status: 'concluida',
      completed_at: new Date().toISOString(),
      xp_concedido: true
    });

    navigate(createPageUrl('Tasks'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <p className="text-gray-400">Tarefa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <Button variant="ghost" onClick={() => navigate(createPageUrl('Tasks'))} className="hover:bg-white/10">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h1 className="text-2xl font-bold mb-4">{task.title}</h1>
            {task.description && <p className="text-gray-400">{task.description}</p>}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#1a1a2e] w-full grid grid-cols-2">
              <TabsTrigger value="formularios" className="data-[state=active]:bg-[#ff5000]">
                Formulários
              </TabsTrigger>
              <TabsTrigger value="ajuste" className="data-[state=active]:bg-[#ff5000]">
                Ajustes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formularios" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Formulários de Conteúdo</h3>
                  <Button onClick={() => handleNovoFormulario('feed')} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Formulário
                  </Button>
                </div>

                {formularios.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400">Nenhum formulário criado ainda</p>
                    <p className="text-sm text-gray-500 mt-2">Clique em "Novo Formulário" para começar</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {formularios.map(form => (
                      <div key={form.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#ff5000]/20 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[#ff5000]" />
                          </div>
                          <div>
                            <h4 className="font-medium">{form.nome_formulario}</h4>
                            <p className="text-sm text-gray-400 capitalize">{form.tipo.replace('_', ' ')} • {form.status}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingFormulario(form);
                              setShowFormularioModal(true);
                            }}
                            className="border-white/10"
                          >
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteFormulario(form.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Eventos da Tarefa */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <EventTimeline
                    events={task.events}
                    currentEventIndex={task.current_event_index || 0}
                    onMoveNext={async (index) => {
                      await localApp.entities.Task.update(task.id, { current_event_index: index + 1 });
                      loadData();
                    }}
                    onMovePrevious={async (index) => {
                      await localApp.entities.Task.update(task.id, { current_event_index: index - 1 });
                      loadData();
                    }}
                  />
                </div>
              </div>

              {showFormularioModal && editingFormulario && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto p-4">
                  <div className="max-w-7xl mx-auto py-8">
                    <div className="glass-card rounded-2xl p-6">
                      <FormularioEditor
                        formulario={editingFormulario}
                        task={task}
                        onSave={handleSaveFormulario}
                        onUpdateTask={async (taskId, updates) => {
                          await localApp.entities.Task.update(taskId, updates);
                          loadData();
                        }}
                        onClose={() => {
                          setShowFormularioModal(false);
                          setEditingFormulario(null);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ajuste" className="mt-6">
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="font-bold">Solicitar Ajuste</h3>
                <Textarea
                  value={ajusteComment}
                  onChange={(e) => setAjusteComment(e.target.value)}
                  placeholder="Descreva o ajuste necessário..."
                  className="bg-[#1a1a2e] border-white/10 min-h-32"
                />
                
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="ajuste-files"
                  />
                  <label htmlFor="ajuste-files">
                    <Button type="button" variant="outline" className="border-white/10" asChild>
                      <span>📎 Anexar Arquivos</span>
                    </Button>
                  </label>
                  {ajusteFiles.length > 0 && (
                    <p className="text-sm text-gray-400 mt-2">{ajusteFiles.length} arquivo(s) anexado(s)</p>
                  )}
                </div>

                <Button onClick={handleSaveAjuste} className="gradient-primary w-full">
                  Salvar Ajuste
                </Button>

                {task.ajustes?.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium">Histórico de Ajustes</h4>
                    {task.ajustes.map((ajuste, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#1a1a2e]">
                        <p className="text-sm">{ajuste.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ajuste.created_by} • {new Date(ajuste.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Eventos da Tarefa */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <EventTimeline
                    events={task.events}
                    currentEventIndex={task.current_event_index || 0}
                    onMoveNext={async (index) => {
                      await localApp.entities.Task.update(task.id, { current_event_index: index + 1 });
                      loadData();
                    }}
                    onMovePrevious={async (index) => {
                      await localApp.entities.Task.update(task.id, { current_event_index: index - 1 });
                      loadData();
                    }}
                  />
                </div>
              </div>
            </TabsContent>


          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#ff5000]" />
              <div>
                <p className="text-xs text-gray-500">Prazo</p>
                <p className="font-medium">{new Date(task.due_date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#ff5000]" />
              <div>
                <p className="text-xs text-gray-500">Responsável</p>
                <p className="font-medium">{task.responsible_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-[#ff5000]" />
              <div>
                <p className="text-xs text-gray-500">Prioridade</p>
                <p className="font-medium capitalize">{task.priority}</p>
              </div>
            </div>
          </div>

          {user?.role === 'admin' && task.events?.every(e => e.status === 'completed') && (
            <Button onClick={handleFinalizeTask} className="w-full gradient-primary">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar Tarefa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}