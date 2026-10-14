import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Columns,
  List,
  ClipboardList,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import KanbanBoard   from '../components/tasks/KanbanBoard';
import TaskListView  from '../components/tasks/TaskListView';
import TaskModal     from '../components/tasks/TaskModal';
import WeeklyPlanner from '../components/tasks/WeeklyPlanner';
import MonthlyPlanner from '../components/tasks/MonthlyPlanner';
import ClientPlansView from '../components/tasks/ClientPlansView';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const AREAS = [
  { value: 'gestao', label: 'Gestão' },
  { value: 'campanhas', label: 'Campanhas' },
  { value: 'projetos', label: 'Projetos' },
];

const CARTEIRAS = [
  { value: 'c1', label: 'C1' },
  { value: 'c2', label: 'C2' },
  { value: 'c3', label: 'C3' },
  { value: 'c4', label: 'C4' },
  { value: 'projetos', label: 'Projetos' },
  { value: 'cancelados', label: 'Cancelados' },
  { value: 'nao_definida', label: 'Não definida' },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [employee, setEmployee]   = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients]     = useState([]);
  const [contracts, setContracts] = useState([]);
  const [plans, setPlans]         = useState([]);
  const [templates, setTemplates] = useState([]);
  const [squads, setSquads]       = useState([]);
  const [loading, setLoading]     = useState(true);

  const [showTaskModal, setShowTaskModal]   = useState(false);
  const [editingTask, setEditingTask]       = useState(null);
  const [initialStatus, setInitialStatus]  = useState('a_fazer');

  // Saved preference
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('tasks_view_v2') || 'production');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [referenceMonth, setReferenceMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [taskContext, setTaskContext] = useState(null);

  // Filters — squad começa na carteira do usuário, mas é removível
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterUser,     setFilterUser]     = useState('all');
  const [filterSquad,    setFilterSquad]    = useState('all');
  const [filterClient,   setFilterClient]   = useState('all');
  const [filterDate,     setFilterDate]     = useState('all');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterArea,     setFilterArea]     = useState('gestao');
  const [filterCarteira, setFilterCarteira] = useState('all');
  const [showFilters,    setShowFilters]    = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  useEffect(() => { loadData(); }, []);

  const handleViewModeChange = (v) => {
    setViewMode(v);
    localStorage.setItem('tasks_view_v2', v);
  };

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);

      const isAdmin = currentUser.role === 'admin';

      const [employeesData, usersData, tasksData, templatesData, squadsData, clientsData, contractsData, plansData] = await Promise.all([
        localApp.entities.Employee.list(),
        localApp.entities.User.list(),
        localApp.entities.Task.list(),
        localApp.entities.TaskTemplate.list(),
        localApp.entities.Squad.list(),
        localApp.entities.Client.list(),
        localApp.entities.Contract.list(),
        localApp.entities.Plan.list(),
      ]);

      const employeesWithNames = employeesData.map(emp => {
        const userData = usersData.find(u => u.id === emp.user_id);
        return { ...emp, full_name: userData?.full_name || emp.full_name, email: userData?.email || '' };
      });

      setEmployees(employeesWithNames);
      // Aba Tarefas é operacional: carrega tudo, filtro por carteira é feito na UI
      setTasks(tasksData);
      setTemplates(templatesData);
      setSquads(squadsData);
      setClients(clientsData);
      setContracts(contractsData);
      setPlans(plansData);

      const emp = employeesWithNames.find(e => e.user_id === currentUser.id);
      setEmployee(emp);

      // Inicializa filtro de carteira do usuário (só na primeira carga)
      if (!filtersInitialized) {
        if (!isAdmin && emp?.carteira) {
          setFilterCarteira(emp.carteira);
        }
        setFiltersInitialized(true);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await localApp.entities.Task.update(editingTask.id, taskData);
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      const newTask = await localApp.entities.Task.create(taskData);
      setTasks(prev => [...prev, newTask]);
    }
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskContext(null);
  };

  const handleStatusChange = async (task, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'concluida' && task.status !== 'concluida') {
      updates.completed_at = new Date().toISOString();
      if (employee) {
        const newXP = (employee.xp_total || 0) + (task.xp_reward || 50);
        const newLevel = Math.floor(newXP / 1000) + 1;
        await localApp.entities.Employee.update(employee.id, { xp_total: newXP, current_level: newLevel });
        setEmployee(prev => ({ ...prev, xp_total: newXP, current_level: newLevel }));
      }
    }
    await localApp.entities.Task.update(task.id, updates);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
  };

  const handleDeleteTask = async (task) => {
    await localApp.entities.Task.delete(task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const handleTaskClick = (task) => {
    navigate(`${createPageUrl('TaskDetail')}?id=${task.id}`);
  };

  const handleNewTaskInColumn = (status) => {
    setTaskContext(null);
    setInitialStatus(status);
    setShowTaskModal(true);
  };

  const clientsInSelection = clients.filter(client =>
    (client.area || 'gestao') === filterArea &&
    (filterCarteira === 'all' || client.carteira === filterCarteira)
  );
  const selectedClient = clientsInSelection.find(client => client.id === selectedClientId) || clientsInSelection[0] || null;

  useEffect(() => {
    if (selectedClientId !== (selectedClient?.id || null)) setSelectedClientId(selectedClient?.id || null);
  }, [selectedClientId, selectedClient?.id]);

  const handleCreateTaskForClient = (client, plan) => {
    setTaskContext({ client, plan });
    setEditingTask(null);
    setInitialStatus('a_fazer');
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskContext(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterUser !== 'all' && task.responsible_email !== filterUser) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'em_aberto' && task.status === 'concluida') return false;
      if (filterStatus === 'concluido' && task.status !== 'concluida') return false;
    }
    if (filterClient !== 'all' && task.client_id !== filterClient) return false;
    if (filterSquad !== 'all' && task.squad_id !== filterSquad) return false;
    const taskClient = clients.find(client => client.id === task.client_id);
    if (filterArea !== 'all' && (taskClient?.area || 'gestao') !== filterArea) return false;
    if (filterCarteira !== 'all') {
      if (taskClient?.carteira !== filterCarteira) return false;
    }
    if (filterDate !== 'all') {
      const today = new Date();
      const taskDate = new Date(task.due_date);
      if (filterDate === 'hoje')        { if (taskDate.toDateString() !== today.toDateString()) return false; }
      if (filterDate === 'esta_semana') { const w = new Date(today.getTime() + 7*86400000); if (!(taskDate >= today && taskDate <= w)) return false; }
      if (filterDate === 'este_mes')    { if (taskDate.getMonth() !== today.getMonth()) return false; }
      if (filterDate === 'atrasadas')   { if (!(taskDate < today && task.status !== 'concluida')) return false; }
    }
    return true;
  });

  const navigateDate = (dir) => {
    if (viewMode === 'weekly') {
      setCurrentDate(prev => dir === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => dir === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }
  };

  const activeFilters = [filterPriority, filterUser, filterSquad, filterClient, filterDate, filterStatus, filterCarteira].filter(f => f !== 'all').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-[145px_155px_minmax(0,1fr)] xl:grid-cols-[165px_180px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:self-start">
          <h2 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Áreas</h2>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {AREAS.map(area => (
              <button
                key={area.value}
                type="button"
                onClick={() => { setFilterArea(area.value); setFilterCarteira('all'); }}
                className={`flex shrink-0 items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left text-sm transition-colors lg:w-full ${
                  filterArea === area.value
                    ? 'border-[#ff5000]/50 bg-[#ff5000]/15 text-[#ff5000]'
                    : 'border-white/5 bg-[#12121a] text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {area.label}
                {filterArea === area.value && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5000]" />}
              </button>
            ))}
          </nav>
        </aside>

        <aside className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:self-start">
          <h2 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Carteiras</h2>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {[{ value: 'all', label: 'Todas' }, ...CARTEIRAS].map(carteira => (
              <button
                key={carteira.value}
                type="button"
                onClick={() => setFilterCarteira(carteira.value)}
                className={`flex shrink-0 items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left text-sm transition-colors lg:w-full ${
                  filterCarteira === carteira.value
                    ? 'border-[#ff5000]/50 bg-[#ff5000]/15 text-white'
                    : 'border-white/5 bg-[#12121a] text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="truncate">{carteira.label}</span>
                {filterCarteira === carteira.value && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5000]" />}
              </button>
            ))}
          </nav>
        </aside>

        <section className="col-span-2 min-w-0 space-y-5 lg:col-span-1">
          <Tabs value={viewMode} onValueChange={handleViewModeChange}>
            <TabsList className="grid w-full max-w-lg grid-cols-5 bg-[#1a1a2e]">
              <TabsTrigger value="production" title="Clientes e planos" className="data-[state=active]:bg-[#ff5000]"><ClipboardList className="h-4 w-4" /><span className="sr-only">Planos</span></TabsTrigger>
              <TabsTrigger value="kanban" title="Kanban" className="data-[state=active]:bg-[#ff5000]"><Columns className="h-4 w-4" /><span className="sr-only">Kanban</span></TabsTrigger>
              <TabsTrigger value="list" title="Lista" className="data-[state=active]:bg-[#ff5000]"><List className="h-4 w-4" /><span className="sr-only">Lista</span></TabsTrigger>
              <TabsTrigger value="weekly" title="Semana" className="data-[state=active]:bg-[#ff5000]"><LayoutGrid className="h-4 w-4" /><span className="sr-only">Semana</span></TabsTrigger>
              <TabsTrigger value="monthly" title="Mês" className="data-[state=active]:bg-[#ff5000]"><CalendarIcon className="h-4 w-4" /><span className="sr-only">Mês</span></TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === 'production' && (
            <ClientPlansView
              areaLabel={AREAS.find(area => area.value === filterArea)?.label || 'Todas as áreas'}
              clients={clientsInSelection}
              selectedClient={selectedClient}
              onSelectClient={setSelectedClientId}
              contracts={contracts}
              plans={plans}
              tasks={tasks}
              month={referenceMonth}
              onMonthChange={setReferenceMonth}
              onCreateTask={handleCreateTaskForClient}
              onBrowseClients={() => navigate(createPageUrl('Cadastros'))}
              onBrowsePlans={() => navigate(createPageUrl('Comercial'))}
              onOpenTask={handleTaskClick}
            />
          )}

          {viewMode !== 'production' && (
          <div className="space-y-5">
      {/* ───── Header ───── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tarefas</h1>
          <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
            {filteredTasks.length} tarefas · {filteredTasks.filter(t => t.status === 'concluida').length} concluídas
            {filterCarteira !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff5000]/20 text-[#ff5000] font-medium">
                {filterCarteira.toUpperCase()}
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => { setTaskContext(null); setInitialStatus('a_fazer'); setShowTaskModal(true); }} className="gradient-primary shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* ───── Search + View Toggle + Filter Toggle ───── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[180px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Buscar tarefa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1a2e] border-white/10"
          />
        </div>

        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
            showFilters || activeFilters > 0
              ? 'bg-[#ff5000]/20 border-[#ff5000]/40 text-[#ff5000]'
              : 'bg-[#1a1a2e] border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeFilters > 0 && (
            <span className="bg-[#ff5000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {activeFilters}
            </span>
          )}
        </button>

      </div>

      {/* ───── Collapsible Filters ───── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            key="filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-[#12121a] border border-white/6">
              {/* Responsável */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">Responsável</p>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="all">Todos</SelectItem>
                    {employees.filter(e => e.email).map(emp => (
                      <SelectItem key={emp.user_id} value={emp.email}>{emp.full_name || emp.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cliente */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">Cliente</p>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="all">Todos</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Squad */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">Squad</p>
                <Select value={filterSquad} onValueChange={setFilterSquad}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="all">Todas</SelectItem>
                    {squads.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridade */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">Prioridade</p>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prazo */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">Prazo</p>
                <Select value={filterDate} onValueChange={setFilterDate}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="all">Todas as datas</SelectItem>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="esta_semana">Esta semana</SelectItem>
                    <SelectItem value="este_mes">Este mês</SelectItem>
                    <SelectItem value="atrasadas">⚠️ Atrasadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Situação */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">Situação</p>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="em_aberto">Em Aberto</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setFilterPriority('all'); setFilterUser('all'); setFilterSquad('all');
                  setFilterClient('all'); setFilterDate('all'); setFilterStatus('all'); setFilterCarteira('all');
                }}
                className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── Date Nav (planners) ───── */}
      {(viewMode === 'weekly' || viewMode === 'monthly') && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigateDate('prev')} className="hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {viewMode === 'weekly'
              ? `Semana de ${format(currentDate, "d 'de' MMMM", { locale: ptBR })}`
              : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <Button variant="ghost" onClick={() => navigateDate('next')} className="hover:bg-white/10">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* ───── Views ───── */}
      <AnimatePresence mode="wait">
        {viewMode === 'kanban' && (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
              onNewTask={handleNewTaskInColumn}
            />
          </motion.div>
        )}

        {viewMode === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TaskListView tasks={filteredTasks} onTaskClick={handleTaskClick} />
          </motion.div>
        )}

        {viewMode === 'weekly' && (
          <motion.div key="weekly" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WeeklyPlanner tasks={filteredTasks} currentDate={currentDate} onTaskClick={handleTaskClick} />
          </motion.div>
        )}

        {viewMode === 'monthly' && (
          <motion.div key="monthly" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MonthlyPlanner tasks={filteredTasks} currentDate={currentDate} onTaskClick={handleTaskClick} />
          </motion.div>
        )}
      </AnimatePresence>
        </div>
        )}

        </section>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={closeTaskModal}
        task={editingTask}
        onSave={handleSaveTask}
        employees={employees}
        templates={templates}
        currentUserEmail={user?.email}
        initialClient={taskContext?.client}
        initialPlan={taskContext?.plan}
      />
    </div>
  );
}