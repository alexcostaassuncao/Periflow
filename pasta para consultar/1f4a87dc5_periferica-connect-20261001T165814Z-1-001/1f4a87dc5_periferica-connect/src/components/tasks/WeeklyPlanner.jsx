import React from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock, Zap } from 'lucide-react';

const statusColors = {
  a_fazer: 'border-l-gray-400',
  em_andamento: 'border-l-blue-400',
  em_revisao: 'border-l-yellow-400',
  aguardando_aprovacao: 'border-l-purple-400',
  concluida: 'border-l-green-400'
};

const priorityBg = {
  alta: 'bg-red-500/10',
  media: 'bg-yellow-500/10',
  baixa: 'bg-green-500/10'
};

export default function WeeklyPlanner({ tasks, currentDate, onTaskClick }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTasksForDay = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return isSameDay(taskDate, date);
    });
  };

  const isToday = (date) => isSameDay(date, new Date());

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/10">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`p-4 text-center border-r border-white/5 last:border-r-0 ${
              isToday(day) ? 'bg-[#ff5000]/10' : ''
            }`}
          >
            <p className="text-xs text-gray-500 uppercase">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p className={`text-lg font-bold ${isToday(day) ? 'text-[#ff5000]' : ''}`}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 min-h-[400px]">
        {weekDays.map((day, dayIndex) => {
          const dayTasks = getTasksForDay(day);
          return (
            <div
              key={dayIndex}
              className={`p-2 border-r border-white/5 last:border-r-0 ${
                isToday(day) ? 'bg-[#ff5000]/5' : ''
              }`}
            >
              <div className="space-y-2">
                {dayTasks.slice(0, 4).map((task, taskIndex) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: taskIndex * 0.05 }}
                    onClick={() => onTaskClick?.(task)}
                    className={`p-2 rounded-lg border-l-2 ${statusColors[task.status]} ${priorityBg[task.priority]} cursor-pointer hover:bg-white/5 transition-all`}
                  >
                    <p className="text-xs font-medium line-clamp-2">{task.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="w-3 h-3 text-[#ff5000]" />
                      <span className="text-[10px] text-gray-400">+{task.xp_reward || 50}</span>
                    </div>
                  </motion.div>
                ))}
                {dayTasks.length > 4 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{dayTasks.length - 4} mais
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}