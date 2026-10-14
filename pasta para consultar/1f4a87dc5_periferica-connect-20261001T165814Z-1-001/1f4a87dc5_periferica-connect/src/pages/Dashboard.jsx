import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sparkles, TrendingUp, Calendar, CalendarDays, Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import XPProgress from '../components/dashboard/XPProgress';
import StatsCards from '../components/dashboard/StatsCards';
import TasksToday from '../components/dashboard/TasksToday';
import QuickActions from '../components/dashboard/QuickActions';
import TaskModal from '../components/tasks/TaskModal';
import SquadPerformancePanel from '../components/dashboard/SquadPerformancePanel';

// Gerar meses disponíveis: Jan/2025 até Dez/2026
const getMeses = () => {
  const opts = [];
  for (let y = 2025; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      const v = `${y}-${String(m).padStart(2, '0')}`;
      const label = format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: ptBR });
      opts.push({ value: v, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
  }
  return opts;
};

const MESES = getMeses();
const MES_ATUAL = format(new Date(), 'yyyy-MM');

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedMes, setSelectedMes] = useState(MES_ATUAL);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);

      const [employeesData, tasksData, templatesData] = await Promise.all([
        localApp.entities.Employee.list(),
        localApp.entities.Task.filter({ responsible_email: currentUser.email }),
        localApp.entities.TaskTemplate.list()
      ]);

      setEmployees(employeesData);
      setTemplates(templatesData);

      let emp = employeesData.find(e => e.user_id === currentUser.id);
      if (!emp) {
        emp = await localApp.entities.Employee.create({
          user_id: currentUser.id,
          department: 'gestao',
          position: 'Colaborador',
          xp_total: 0,
          current_level: 1,
          accumulated_minutes: 0,
          bonus_balance: 0,
          tasks_completed: 0,
          streak_days: 0
        });
      }
      setEmployee(emp);
      setTasks(tasksData);
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    const newTask = await localApp.entities.Task.create(taskData);
    setTasks(prev => [...prev, newTask]);
    setShowTaskModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const currentUserCarteira = employee?.carteira || 'all';

  const pendingTasks = tasks.filter(t => t.status !== 'concluida').length;
  const completedToday = tasks.filter(t => {
    if (t.status !== 'concluida' || !t.completed_at) return false;
    return new Date(t.completed_at).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            Olá, {user?.full_name?.split(' ')[0] || 'Usuário'}
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              👋
            </motion.span>
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            {employee?.carteira && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#ff5000]/20 text-[#ff5000] font-medium">
                {employee.carteira.toUpperCase()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro de Mês */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card">
            <CalendarDays className="w-4 h-4 text-[#ff5000]" />
            <Select value={selectedMes} onValueChange={setSelectedMes}>
              <SelectTrigger className="bg-transparent border-0 text-white text-sm p-0 h-auto w-40 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tarefas pendentes badge */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-card">
            <Sparkles className="w-5 h-5 text-[#ff5000]" />
            <div>
              <p className="text-xs text-gray-400">Tarefas pendentes</p>
              <p className="font-bold text-lg">{pendingTasks}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* XP Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <XPProgress employee={employee} />
      </motion.div>

      {/* Stats Cards (gamificação individual) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <StatsCards
          employee={employee}
          tasksToday={tasks.filter(t => new Date(t.due_date).toDateString() === new Date().toDateString()).length}
          tasksCompleted={completedToday}
        />
      </motion.div>

      {/* ── PAINEL DE DESEMPENHO DO SQUAD (dados reais de importação) ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SquadPerformancePanel
          employee={employee}
          isAdmin={isAdmin}
          currentUserCarteira={currentUserCarteira}
          selectedMes={selectedMes}
        />
      </motion.div>

      {/* Tasks hoje + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <TasksToday tasks={tasks} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <QuickActions onNewTask={() => setShowTaskModal(true)} />
        </motion.div>
      </div>

      {/* Atividade Recente (tarefas do sistema) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#ff5000]" />
          Atividade Recente
        </h3>
        <div className="space-y-3">
          {tasks.filter(t => t.status === 'concluida').slice(0, 5).map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 font-bold">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                <p className="text-xs text-gray-500">+{task.xp_reward || 50} XP ganhos</p>
              </div>
            </motion.div>
          ))}
          {tasks.filter(t => t.status === 'concluida').length === 0 && (
            <p className="text-center text-gray-500 py-4">Nenhuma tarefa concluída ainda</p>
          )}
        </div>
      </motion.div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={handleCreateTask}
        employees={employees}
        templates={templates}
        currentUserEmail={user?.email}
      />
    </div>
  );
}