import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const getProgressColor = (pct) => {
  if (pct >= 80) return { bar: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' };
  if (pct >= 60) return { bar: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' };
  return { bar: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' };
};

export default function SquadProgressCard({ squad, delay = 0 }) {
  const { name, pct, concluidas, pendentes, atrasadas } = squad;
  const colors = getProgressColor(pct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-5 space-y-4 border"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{name}</h3>
        <span className="text-2xl font-black" style={{ color: colors.text }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-7 rounded-lg overflow-hidden bg-black/30">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-lg"
          style={{ backgroundColor: colors.bar }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: delay + 0.2 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow">{pct}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-black/20 p-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Concluídas</p>
          <p className="font-bold text-sm text-green-400">{concluidas}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2">
          <Clock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Pendentes</p>
          <p className="font-bold text-sm text-yellow-400">{pendentes}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2">
          <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Atrasadas</p>
          <p className="font-bold text-sm text-red-400">{atrasadas}</p>
        </div>
      </div>
    </motion.div>
  );
}