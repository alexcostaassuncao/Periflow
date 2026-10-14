import React from 'react';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameDay, 
  isSameMonth 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Zap } from 'lucide-react';

const priorityDot = {
  alta: 'bg-red-400',
  media: 'bg-yellow-400',
  baixa: 'bg-green-400'
};

export default function MonthlyPlanner({ tasks, currentDate, onTaskClick, onDayClick }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getTasksForDay = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return isSameDay(taskDate, date);
    });
  };

  const isToday = (date) => isSameDay(date, new Date());
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {weekDays.map((dayName, index) => (
          <div key={index} className="p-3 text-center">
            <p className="text-xs text-gray-500 uppercase font-medium">{dayName}</p>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((dayDate, index) => {
          const dayTasks = getTasksForDay(dayDate);
          const isCurrentMonth = isSameMonth(dayDate, currentDate);
          const today = isToday(dayDate);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => onDayClick?.(dayDate)}
              className={`min-h-[100px] p-2 border-b border-r border-white/5 cursor-pointer hover:bg-white/5 transition-all ${
                !isCurrentMonth ? 'opacity-30' : ''
              } ${today ? 'bg-[#ff5000]/10' : ''}`}
            >
              <p className={`text-sm font-medium mb-1 ${today ? 'text-[#ff5000]' : ''}`}>
                {format(dayDate, 'd')}
              </p>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); onTaskClick?.(task); }}
                    className="flex items-center gap-1 p-1 rounded bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} />
                    <p className="text-[10px] truncate flex-1">{task.title}</p>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-gray-500">+{dayTasks.length - 3}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}