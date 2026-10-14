import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const priorityConfig = {
  alta: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  media: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  baixa: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' }
};

const statusConfig = {
  a_fazer: { icon: Circle, color: 'text-gray-400' },
  em_andamento: { icon: Clock, color: 'text-blue-400' },
  em_revisao: { icon: AlertTriangle, color: 'text-yellow-400' },
  aguardando_aprovacao: { icon: Clock, color: 'text-purple-400' },
  concluida: { icon: CheckCircle2, color: 'text-green-400' }
};

export default function TasksToday({ tasks }) {
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.due_date);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  }).slice(0, 5);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Tarefas de Hoje</h3>
        <Link 
          to={createPageUrl('Tasks')}
          className="text-[#ff5000] text-sm font-medium flex items-center gap-1 hover:underline"
        >
          Ver todas <ChevronRight size={16} />
        </Link>
      </div>

      {todayTasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-gray-400">Nenhuma tarefa para hoje!</p>
          <p className="text-xs text-gray-500 mt-1">Aproveite para adiantar as próximas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayTasks.map((task, index) => {
            const priority = priorityConfig[task.priority] || priorityConfig.media;
            const status = statusConfig[task.status] || statusConfig.a_fazer;
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl bg-[#1a1a2e]/50 border ${priority.border} hover:bg-[#1a1a2e] transition-all cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon className={`w-5 h-5 mt-0.5 ${status.color}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        +{task.xp_reward || 50} XP
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}