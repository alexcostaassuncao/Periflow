import React, { useState, useEffect, useMemo } from 'react';
import { localApp } from '@/api/localClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  addDays, isSameDay, isSameMonth,
  addMonths, subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus, ChevronLeft, ChevronRight, X,
  Clock, MapPin, Users, Filter, Calendar as CalIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import UserMentionInput from '../components/calendar/UserMentionInput';
import DayDetailModal from '../components/calendar/DayDetailModal';

const EVENT_TYPE_CONFIG = {
  reuniao_interna:    { color: 'bg-blue-500',    label: 'Reunião Interna',       dot: '#3b82f6' },
  reuniao_externa:    { color: 'bg-blue-600',     label: 'Reunião Externa',        dot: '#2563eb' },
  reuniao_comercial:  { color: 'bg-indigo-500',   label: 'Reunião Comercial',      dot: '#6366f1' },
  gravacao_interna:   { color: 'bg-purple-500',   label: 'Gravação Interna',       dot: '#a855f7' },
  gravacao_externa:   { color: 'bg-purple-600',   label: 'Gravação Externa',       dot: '#9333ea' },
  falta:              { color: 'bg-red-500',      label: 'Falta/Ausência',         dot: '#ef4444' },
  ausencia:           { color: 'bg-orange-500',   label: 'Ausência',               dot: '#f97316' },
  conteudo_programado:{ color: 'bg-yellow-500',   label: 'Conteúdo Programado',    dot: '#eab308' },
  conteudo_publicado: { color: 'bg-green-500',    label: 'Conteúdo Publicado',     dot: '#22c55e' },
};

const FILTER_OPTIONS = [
  { value: 'all',               label: 'Todos os eventos' },
  { value: 'reuniao_comercial', label: 'Reuniões Comerciais' },
  { value: 'gravacao_interna',  label: 'Videomakers' },
  { value: 'falta',             label: 'Ausências' },
  { value: 'reuniao_interna',   label: 'Eventos Internos' },
  { value: 'tasks',             label: 'Prazos de Tarefas' },
];

export default function Calendar() {
  const [user, setUser]           = useState(null);
  const [events, setEvents]       = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [crmLeads, setCrmLeads]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterType, setFilterType]         = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterDept, setFilterDept]         = useState('all');
  const [filterClient, setFilterClient]     = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', event_type: 'reuniao_interna',
    start_datetime: '', end_datetime: '', location: '',
    client_id: '', participants: [], video_maker: '',
    motivo_ausencia: '', meeting_link: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);
      const [eventsData, tasksData, leadsData, empsData] = await Promise.all([
        localApp.entities.CalendarEvent.list(),
        localApp.entities.Task.list(),
        localApp.entities.CRMLead.filter({ status: 'reuniao_marcada' }),
        localApp.entities.Employee.list(),
      ]);
      setEvents(eventsData);
      setTasks(tasksData);
      setCrmLeads(leadsData);
      setEmployees(empsData);
    } catch (e) {
      console.log('Error loading calendar data:', e);
    } finally {
      setLoading(false);
    }
  };

  // --- Calendar grid ---
  const monthStart    = startOfMonth(currentDate);
  const monthEnd      = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd   = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) { days.push(day); day = addDays(day, 1); }

  // --- Filtrar eventos ---
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterType !== 'all' && filterType !== 'tasks' && e.event_type !== filterType) return false;
      if (filterEmployee !== 'all') {
        const match =
          e.participants?.includes(filterEmployee) ||
          e.created_by === filterEmployee ||
          (e.video_maker && filterEmployee.includes(e.video_maker));
        if (!match) return false;
      }
      if (filterClient) {
        const lower = filterClient.toLowerCase();
        if (
          !e.title?.toLowerCase().includes(lower) &&
          !e.prospect_name?.toLowerCase().includes(lower) &&
          !e.client_id?.toLowerCase().includes(lower)
        ) return false;
      }
      return true;
    });
  }, [events, filterType, filterEmployee, filterClient]);

  const filteredTasks = useMemo(() => {
    if (filterType !== 'all' && filterType !== 'tasks') return [];
    return tasks.filter(t => {
      if (filterEmployee !== 'all' && t.responsible_email !== filterEmployee) return false;
      if (filterDept !== 'all') return false; // tarefas não têm dept direto
      if (filterClient) {
        const lower = filterClient.toLowerCase();
        if (!t.title?.toLowerCase().includes(lower) && !t.client_name?.toLowerCase().includes(lower)) return false;
      }
      return true;
    });
  }, [tasks, filterType, filterEmployee, filterDept, filterClient]);

  const getEventsForDay  = (d) => filteredEvents.filter(e => e.start_datetime && isSameDay(new Date(e.start_datetime), d));
  const getTasksForDay   = (d) => filteredTasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), d));

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      start_datetime: format(date, "yyyy-MM-dd'T'09:00"),
      end_datetime: format(date, "yyyy-MM-dd'T'10:00"),
    }));
    setShowDayModal(true);
  };

  const handleOpenNewEventFromModal = () => {
    setShowDayModal(false);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (editingEvent) {
      await localApp.entities.CalendarEvent.update(editingEvent.id, formData);
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...formData } : e));
    } else {
      const newEvent = await localApp.entities.CalendarEvent.create(formData);
      setEvents(prev => [...prev, newEvent]);
      // Notify creator
      const me = await localApp.auth.me();
      await localApp.entities.Notification.create({
        user_email: me.email, type: 'reuniao',
        title: 'Evento Criado', message: `Você criou: ${formData.title}`, event_id: newEvent.id,
      });
      if (formData.participants?.length > 0) {
        await Promise.all(formData.participants.map(email =>
          localApp.entities.Notification.create({
            user_email: email, type: 'reuniao',
            title: 'Você foi adicionado a um evento',
            message: `${me.full_name} adicionou você ao evento: ${formData.title}`,
            event_id: newEvent.id,
          })
        ));
      }
    }
    setShowEventModal(false);
    setEditingEvent(null);
    resetForm();
  };

  const handleDeleteEvent = async (event) => {
    await localApp.entities.CalendarEvent.delete(event.id);
    setEvents(prev => prev.filter(e => e.id !== event.id));
  };

  const resetForm = () => setFormData({
    title: '', description: '', event_type: 'reuniao_interna',
    start_datetime: '', end_datetime: '', location: '',
    client_id: '', participants: [], video_maker: '',
    motivo_ausencia: '', meeting_link: '',
  });

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Unique employees for filter (deduplicated by user_id)
  const employeeOptions = useMemo(() => {
    const seen = new Set();
    return employees
      .filter(e => {
        if (!e.user_id || seen.has(e.user_id)) return false;
        seen.add(e.user_id);
        return true;
      })
      .map(e => ({ id: e.user_id, label: e.user_id }));
  }, [employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Calendário</h1>
          <p className="text-gray-400 mt-1">Central de agenda da empresa</p>
        </div>
        <Button onClick={() => { setEditingEvent(null); resetForm(); setShowEventModal(true); }} className="gradient-primary">
          <Plus className="w-5 h-5 mr-2" />Novo Evento
        </Button>
      </div>

      {/* Filtros */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-400">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Tipo */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-sm h-9">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              {FILTER_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Departamento */}
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-sm h-9">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all">Todos os setores</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="trafego">Tráfego</SelectItem>
              <SelectItem value="atendimento">Atendimento</SelectItem>
              <SelectItem value="gestao">Gestão</SelectItem>
            </SelectContent>
          </Select>

          {/* Funcionário */}
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-sm h-9">
              <SelectValue placeholder="Funcionário" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all">Todos os funcionários</SelectItem>
              {employeeOptions.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cliente */}
          <Input
            placeholder="Buscar por cliente..."
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className="bg-[#1a1a2e] border-white/10 text-sm h-9"
          />
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
          {Object.entries(EVENT_TYPE_CONFIG).slice(0, 6).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.dot }} />
              <span className="text-xs text-gray-500">{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5000]" />
            <span className="text-xs text-gray-500">Prazo de Tarefa</span>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between glass-card rounded-2xl p-4">
        <Button variant="ghost" onClick={() => setCurrentDate(prev => subMonths(prev, 1))} className="hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold">
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <Button variant="ghost" onClick={() => setCurrentDate(prev => addMonths(prev, 1))} className="hover:bg-white/10">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10">
          {weekDays.map((d, i) => (
            <div key={i} className="p-3 text-center">
              <p className="text-xs text-gray-400 font-medium">{d}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((dayDate, index) => {
            const dayEvents = getEventsForDay(dayDate);
            const dayTasks  = getTasksForDay(dayDate);
            const isCurrentMonth = isSameMonth(dayDate, currentDate);
            const isToday    = isSameDay(dayDate, new Date());
            const total = dayEvents.length + dayTasks.length;

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleDayClick(dayDate)}
                className={`min-h-[100px] p-2 border-b border-r border-white/5 cursor-pointer transition-all
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isToday ? 'bg-[#ff5000]/10' : 'hover:bg-white/5'}`}
              >
                <p className={`text-xs font-semibold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-[#ff5000] text-white' : 'text-gray-300'}`}>
                  {format(dayDate, 'd')}
                </p>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate text-white
                        ${EVENT_TYPE_CONFIG[event.event_type]?.color || 'bg-gray-500'}`}
                    >
                      {event.start_datetime && `${format(new Date(event.start_datetime), 'HH:mm')} `}
                      {event.title}
                    </div>
                  ))}
                  {dayTasks.slice(0, 2).map(task => (
                    <div key={task.id} className="text-[10px] px-1.5 py-0.5 rounded truncate text-white bg-[#ff5000]/70">
                      📋 {task.title}
                    </div>
                  ))}
                  {total > 3 && (
                    <p className="text-[10px] text-gray-500 pl-1">+{total - 3} mais</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {showDayModal && selectedDate && (
          <DayDetailModal
            date={selectedDate}
            events={getEventsForDay(selectedDate)}
            tasks={getTasksForDay(selectedDate)}
            crmLeads={crmLeads}
            onClose={() => setShowDayModal(false)}
            onNewEvent={handleOpenNewEventFromModal}
          />
        )}
      </AnimatePresence>

      {/* Event Create/Edit Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#12121a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-[#ff5000]/20 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold">{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h2>
                <button onClick={() => setShowEventModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <Label className="text-gray-400 mb-1.5 block text-sm">Título *</Label>
                  <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="Nome do evento" className="bg-[#1a1a2e] border-white/10" />
                </div>

                <div>
                  <Label className="text-gray-400 mb-1.5 block text-sm">Tipo *</Label>
                  <Select value={formData.event_type} onValueChange={v => setFormData(p => ({ ...p, event_type: v }))}>
                    <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.event_type === 'reuniao_externa' || formData.event_type === 'gravacao_externa' || formData.event_type === 'reuniao_comercial') && (
                  <div>
                    <Label className="text-gray-400 mb-1.5 block text-sm">Cliente / Prospect</Label>
                    <Input value={formData.client_id} onChange={e => setFormData(p => ({ ...p, client_id: e.target.value }))}
                      placeholder="Nome do cliente" className="bg-[#1a1a2e] border-white/10" />
                  </div>
                )}

                {(formData.event_type === 'gravacao_interna' || formData.event_type === 'gravacao_externa') && (
                  <div>
                    <Label className="text-gray-400 mb-1.5 block text-sm">Videomaker</Label>
                    <Select value={formData.video_maker} onValueChange={v => setFormData(p => ({ ...p, video_maker: v }))}>
                      <SelectTrigger className="bg-[#1a1a2e] border-white/10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="julio">Júlio</SelectItem>
                        <SelectItem value="eduardo">Eduardo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.event_type === 'falta' || formData.event_type === 'ausencia') && (
                  <div>
                    <Label className="text-gray-400 mb-1.5 block text-sm">Motivo</Label>
                    <Select value={formData.motivo_ausencia} onValueChange={v => setFormData(p => ({ ...p, motivo_ausencia: v }))}>
                      <SelectTrigger className="bg-[#1a1a2e] border-white/10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="medico">Médico</SelectItem>
                        <SelectItem value="consulta">Consulta</SelectItem>
                        <SelectItem value="compromisso_pessoal">Compromisso Pessoal</SelectItem>
                        <SelectItem value="ferias">Férias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-400 mb-1.5 block text-sm">Início</Label>
                    <Input type="datetime-local" value={formData.start_datetime}
                      onChange={e => setFormData(p => ({ ...p, start_datetime: e.target.value }))}
                      className="bg-[#1a1a2e] border-white/10" />
                  </div>
                  <div>
                    <Label className="text-gray-400 mb-1.5 block text-sm">Fim</Label>
                    <Input type="datetime-local" value={formData.end_datetime}
                      onChange={e => setFormData(p => ({ ...p, end_datetime: e.target.value }))}
                      className="bg-[#1a1a2e] border-white/10" />
                  </div>
                </div>

                {(formData.event_type === 'reuniao_interna' || formData.event_type === 'gravacao_interna') && (
                  <div>
                    <Label className="text-gray-400 mb-1.5 block text-sm">Local</Label>
                    <Select value={formData.location} onValueChange={v => setFormData(p => ({ ...p, location: v }))}>
                      <SelectTrigger className="bg-[#1a1a2e] border-white/10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="Sala de Reunião 1">Sala de Reunião 1</SelectItem>
                        <SelectItem value="Sala de Reunião 2">Sala de Reunião 2</SelectItem>
                        <SelectItem value="Estúdio">Estúdio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.event_type === 'reuniao_externa' || formData.event_type === 'gravacao_externa') && (
                  <div>
                    <Label className="text-gray-400 mb-1.5 block text-sm">Local</Label>
                    <Input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                      placeholder="Endereço externo" className="bg-[#1a1a2e] border-white/10" />
                  </div>
                )}

                {(formData.event_type?.includes('reuniao')) && (
                  <>
                    <div>
                      <Label className="text-gray-400 mb-1.5 block text-sm">Link da Reunião</Label>
                      <Input value={formData.meeting_link} onChange={e => setFormData(p => ({ ...p, meeting_link: e.target.value }))}
                        placeholder="https://meet.google.com/..." className="bg-[#1a1a2e] border-white/10" />
                    </div>
                    <UserMentionInput
                      selectedUsers={formData.participants || []}
                      onChange={participants => setFormData(p => ({ ...p, participants }))}
                      label="Participantes"
                    />
                  </>
                )}

                <div>
                  <Label className="text-gray-400 mb-1.5 block text-sm">Descrição</Label>
                  <Textarea value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Detalhes do evento..." className="bg-[#1a1a2e] border-white/10 min-h-[70px]" />
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-white/10">
                <Button variant="outline" onClick={() => setShowEventModal(false)} className="flex-1 border-white/10 bg-transparent text-gray-300 hover:bg-white/5">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEvent} disabled={!formData.title} className="flex-1 gradient-primary">
                  {editingEvent ? 'Salvar' : 'Criar Evento'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}