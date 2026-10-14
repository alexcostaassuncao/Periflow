import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Flame, Gift } from 'lucide-react';

export default function StatsCards({ employee, tasksToday, tasksCompleted }) {
  const stats = [
    {
      icon: CheckCircle,
      label: 'Tarefas Concluídas',
      value: employee?.tasks_completed || 0,
      color: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    {
      icon: Clock,
      label: 'Minutos Acumulados',
      value: employee?.accumulated_minutes || 0,
      suffix: 'min',
      color: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    {
      icon: Flame,
      label: 'Dias de Streak',
      value: employee?.streak_days || 0,
      color: 'from-orange-500 to-red-600',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400'
    },
    {
      icon: Gift,
      label: 'Bônus Acumulado',
      value: `R$ ${(employee?.bonus_balance || 0).toFixed(2)}`,
      color: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card rounded-2xl p-4 hover:border-[#ff5000]/30 transition-all cursor-default"
        >
          <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
          </div>
          <p className="text-2xl font-bold mb-1">
            {stat.value}{stat.suffix && <span className="text-sm text-gray-400 ml-1">{stat.suffix}</span>}
          </p>
          <p className="text-xs text-gray-500">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}