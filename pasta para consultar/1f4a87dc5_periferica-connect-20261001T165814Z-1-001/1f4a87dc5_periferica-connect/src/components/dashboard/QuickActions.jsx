import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Calendar, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function QuickActions({ onNewTask }) {
  const actions = [
    {
      icon: Plus,
      label: 'Nova Tarefa',
      description: 'Criar tarefa',
      onClick: onNewTask,
      gradient: 'from-[#ff5000] to-[#ff7f40]'
    },
    {
      icon: Clock,
      label: 'Registrar Ponto',
      description: 'Check-in/out',
      to: 'TimeTracker',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Calendar,
      label: 'Calendário',
      description: 'Ver eventos',
      to: 'Calendar',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Trophy,
      label: 'Recompensas',
      description: 'Ver prêmios',
      to: 'Rewards',
      gradient: 'from-yellow-500 to-orange-500'
    }
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-bold text-lg mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const content = (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${action.gradient} cursor-pointer`}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <p className="font-medium text-sm">{action.label}</p>
              <p className="text-xs opacity-80">{action.description}</p>
            </motion.div>
          );

          if (action.to) {
            return (
              <Link key={action.label} to={createPageUrl(action.to)}>
                {content}
              </Link>
            );
          }

          return (
            <div key={action.label} onClick={action.onClick}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}