import React from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle2, User, Wrench, Trash2 } from 'lucide-react';

const cards = [
  { key: 'total', label: 'Total de Itens', icon: Package, color: '#ff5000' },
  { key: 'em_estoque', label: 'Em Estoque', icon: CheckCircle2, color: '#22c55e' },
  { key: 'com_funcionario', label: 'Com Funcionário', icon: User, color: '#3b82f6' },
  { key: 'em_manutencao', label: 'Em Manutenção', icon: Wrench, color: '#f59e0b' },
  { key: 'descartado', label: 'Inativos', icon: Trash2, color: '#6b7280' },
];

export default function StockSummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card rounded-2xl p-5"
        >
          <card.icon className="w-5 h-5 mb-3" style={{ color: card.color }} />
          <p className="text-gray-400 text-xs">{card.label}</p>
          <p className="text-2xl font-black mt-1" style={{ color: card.color }}>
            {stats[card.key] ?? 0}
          </p>
        </motion.div>
      ))}
    </div>
  );
}