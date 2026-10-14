import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Zap, Trophy } from 'lucide-react';

export default function XPProgress({ employee }) {
  const currentXP = employee?.xp_total || 0;
  const currentLevel = employee?.current_level || 1;
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const progressPercent = (xpInCurrentLevel / 1000) * 100;

  const getLevelTitle = (level) => {
    if (level <= 5) return 'Iniciante';
    if (level <= 10) return 'Explorador';
    if (level <= 20) return 'Profissional';
    if (level <= 35) return 'Expert';
    if (level <= 50) return 'Mestre';
    return 'Lenda';
  };

  const getLevelIcon = (level) => {
    if (level <= 5) return Zap;
    if (level <= 10) return Flame;
    if (level <= 20) return Star;
    return Trophy;
  };

  const LevelIcon = getLevelIcon(currentLevel);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div 
              className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-2xl font-black">{currentLevel}</span>
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0a0f] flex items-center justify-center">
              <LevelIcon className="w-4 h-4 text-[#ff5000]" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg">{getLevelTitle(currentLevel)}</h3>
            <p className="text-sm text-gray-400">Nível {currentLevel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#ff5000]">{currentXP.toLocaleString()}</p>
          <p className="text-xs text-gray-500">XP Total</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progresso do nível</span>
          <span className="text-[#ff5000] font-medium">{xpInCurrentLevel} / 1000 XP</span>
        </div>
        <div className="h-3 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary relative"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </motion.div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Faltam {1000 - xpInCurrentLevel} XP para o próximo nível
        </p>
      </div>
    </div>
  );
}