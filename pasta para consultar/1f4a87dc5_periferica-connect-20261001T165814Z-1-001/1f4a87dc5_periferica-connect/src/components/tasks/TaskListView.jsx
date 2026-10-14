import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Zap, AlertTriangle, ChevronRight } from 'lucide-react';

const priorityConfig = {
  alta:  { color: '#ef4444', label: 'Alta'  },
  media: { color: '#eab308', label: 'Média' },
  baixa: { color: '#22c55e', label: 'Baixa' },
};

const statusConfig = {
  a_fazer:              { label: 'Backlog',         color: '#6b7280' },
  em_andamento:         { label: 'Em Andamento',    color: '#3b82f6' },
  em_revisao:           { label: 'Em Revisão',      color: '#eab308' },
  aguardando_aprovacao: { label: 'Aprovado',        color: '#a855f7' },
  concluida:            { label: 'Concluído',       color: '#22c55e' },
};

export default function TaskListView({ tasks, onTaskClick }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        Nenhuma tarefa encontrada com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/6" style={{ background: 'rgba(18,18,26,0.7)' }}>
      {/* Table header */}
      <div className="grid grid-cols-12 px-4 py-2.5 text-xs text-gray-500 font-medium border-b border-white/6 uppercase tracking-wide">
        <div className="col-span-4">Tarefa</div>
        <div className="col-span-2">Cliente</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Prioridade</div>
        <div className="col-span-1">Prazo</div>
        <div className="col-span-1 text-right">XP</div>
      </div>

      {tasks.map((task, idx) => {
        const priority  = priorityConfig[task.priority] || priorityConfig.media;
        const status    = statusConfig[task.status]   || statusConfig.a_fazer;
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'concluida';
        const totalEvents     = task.events?.length || 0;
        const completedEvents = task.events?.filter(e => e.status === 'completed').length || 0;

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onTaskClick(task)}
            className="grid grid-cols-12 px-4 py-3 items-center cursor-pointer hover:bg-white/4 transition-all border-b border-white/4 last:border-0 group"
            style={{ borderLeft: `3px solid ${isOverdue ? '#ef4444' : 'transparent'}` }}
          >
            {/* Title */}
            <div className="col-span-4 flex items-center gap-3 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: priority.color }}
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate">{task.title}</p>
                {totalEvents > 0 && (
                  <p className="text-[10px] text-gray-500 mt-0.5">{completedEvents}/{totalEvents} etapas</p>
                )}
              </div>
            </div>

            {/* Client */}
            <div className="col-span-2 text-sm text-gray-400 truncate pr-2">
              {task.client_name || '—'}
            </div>

            {/* Status */}
            <div className="col-span-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: status.color + '22', color: status.color }}
              >
                {status.label}
              </span>
            </div>

            {/* Priority */}
            <div className="col-span-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: priority.color + '22', color: priority.color }}
              >
                {priority.label}
              </span>
            </div>

            {/* Due date */}
            <div className="col-span-1 flex items-center gap-1 text-xs" style={{ color: isOverdue ? '#ef4444' : '#6b7280' }}>
              {isOverdue && <AlertTriangle className="w-3 h-3" />}
              {task.due_date ? format(new Date(task.due_date), 'dd/MM', { locale: ptBR }) : '—'}
            </div>

            {/* XP */}
            <div className="col-span-1 flex items-center justify-end gap-1 text-xs text-[#ff5000]">
              <Zap className="w-3 h-3" />
              {task.xp_reward || 50}
              <ChevronRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}