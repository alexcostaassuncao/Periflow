import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Gift, 
  Clock, 
  Coins, 
  Star, 
  Flame,
  Medal,
  Zap,
  ChevronRight,
  Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const levelRewards = [
  { level: 2, xp: 1000, reward: 'badge', title: 'Iniciante', description: 'Completou primeiras tarefas', icon: Medal, color: 'from-blue-500 to-cyan-500' },
  { level: 5, xp: 4000, reward: 'bonus', value: 50, title: 'R$ 50 de Bônus', description: 'Recompensa em dinheiro', icon: Coins, color: 'from-green-500 to-emerald-500' },
  { level: 10, xp: 9000, reward: 'day_off', value: 240, title: '4 Horas de Folga', description: 'Tempo livre acumulado', icon: Clock, color: 'from-purple-500 to-pink-500' },
  { level: 15, xp: 14000, reward: 'bonus', value: 100, title: 'R$ 100 de Bônus', description: 'Recompensa especial', icon: Gift, color: 'from-yellow-500 to-orange-500' },
  { level: 20, xp: 19000, reward: 'day_off', value: 480, title: '1 Dia de Folga', description: 'Folga completa', icon: Star, color: 'from-red-500 to-rose-500' },
  { level: 30, xp: 29000, reward: 'bonus', value: 200, title: 'R$ 200 de Bônus', description: 'Recompensa expert', icon: Trophy, color: 'from-amber-500 to-yellow-500' },
  { level: 50, xp: 49000, reward: 'day_off', value: 960, title: '2 Dias de Folga', description: 'Recompensa lendária', icon: Zap, color: 'from-violet-500 to-purple-500' }
];

export default function Rewards() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);

      const [employeesData, rewardsData] = await Promise.all([
        localApp.entities.Employee.filter({ user_id: currentUser.id }),
        localApp.entities.Reward.filter({ employee_email: currentUser.email })
      ]);

      if (employeesData.length > 0) {
        setEmployee(employeesData[0]);
      }
      setRewards(rewardsData);
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (levelReward) => {
    const newReward = await localApp.entities.Reward.create({
      employee_email: user.email,
      reward_type: levelReward.reward,
      title: levelReward.title,
      description: levelReward.description,
      value: levelReward.value || 0,
      level_achieved: levelReward.level,
      claimed: true,
      claimed_at: new Date().toISOString()
    });

    setRewards(prev => [...prev, newReward]);

    // Update employee balance
    if (employee && levelReward.reward === 'bonus') {
      const newBalance = (employee.bonus_balance || 0) + levelReward.value;
      await localApp.entities.Employee.update(employee.id, { bonus_balance: newBalance });
      setEmployee(prev => ({ ...prev, bonus_balance: newBalance }));
    } else if (employee && levelReward.reward === 'day_off') {
      const newMinutes = (employee.accumulated_minutes || 0) + levelReward.value;
      await localApp.entities.Employee.update(employee.id, { accumulated_minutes: newMinutes });
      setEmployee(prev => ({ ...prev, accumulated_minutes: newMinutes }));
    }
  };

  const isRewardClaimed = (level) => {
    return rewards.some(r => r.level_achieved === level);
  };

  const isRewardUnlocked = (xp) => {
    return (employee?.xp_total || 0) >= xp;
  };

  const currentXP = employee?.xp_total || 0;
  const currentLevel = employee?.current_level || 1;
  const minutesAccumulated = employee?.accumulated_minutes || 0;
  const hoursAccumulated = Math.floor(minutesAccumulated / 60);
  const remainingMinutes = minutesAccumulated % 60;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Recompensas</h1>
        <p className="text-gray-400 mt-1">Complete tarefas e suba de nível</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#ff5000]/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#ff5000]" />
            </div>
            <span className="text-sm text-gray-400">Nível Atual</span>
          </div>
          <p className="text-3xl font-bold">{currentLevel}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-gray-400">XP Total</span>
          </div>
          <p className="text-3xl font-bold">{currentXP.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-gray-400">Bônus</span>
          </div>
          <p className="text-3xl font-bold">R$ {(employee?.bonus_balance || 0).toFixed(0)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Folga Acumulada</span>
          </div>
          <p className="text-3xl font-bold">{hoursAccumulated}h{remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}</p>
        </motion.div>
      </div>

      {/* Progress to Next Level */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Progresso para Nível {currentLevel + 1}</h3>
          <span className="text-[#ff5000] font-medium">
            {currentXP % 1000} / 1000 XP
          </span>
        </div>
        <div className="h-4 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(currentXP % 1000) / 10}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2 text-center">
          Faltam {1000 - (currentXP % 1000)} XP para o próximo nível
        </p>
      </motion.div>

      {/* Level Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-bold text-lg mb-6">Recompensas por Nível</h3>
        <div className="space-y-4">
          {levelRewards.map((reward, index) => {
            const claimed = isRewardClaimed(reward.level);
            const unlocked = isRewardUnlocked(reward.xp);
            const Icon = reward.icon;
            const progress = Math.min(100, (currentXP / reward.xp) * 100);

            return (
              <motion.div
                key={reward.level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border transition-all ${
                  claimed ? 'bg-green-500/10 border-green-500/30' :
                  unlocked ? 'bg-[#ff5000]/10 border-[#ff5000]/30 hover:border-[#ff5000]/50' :
                  'bg-[#1a1a2e] border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${reward.color} flex items-center justify-center ${!unlocked && 'grayscale'}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                        Nível {reward.level}
                      </span>
                      <span className="text-xs text-gray-500">{reward.xp.toLocaleString()} XP</span>
                    </div>
                    <h4 className="font-bold mt-1">{reward.title}</h4>
                    <p className="text-sm text-gray-400">{reward.description}</p>
                    
                    {!unlocked && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${reward.color}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {claimed ? (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                  ) : unlocked ? (
                    <Button 
                      onClick={() => claimReward(reward)}
                      className="gradient-primary"
                    >
                      Resgatar
                    </Button>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      Bloqueado
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Rewards */}
      {rewards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-bold text-lg mb-4">Recompensas Resgatadas</h3>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a2e]">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{reward.title}</h4>
                  <p className="text-sm text-gray-400">Nível {reward.level_achieved}</p>
                </div>
                <Check className="w-5 h-5 text-green-400" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Streak Bonus Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Streak de {employee?.streak_days || 0} dias</h3>
            <p className="text-gray-400 text-sm">
              Complete tarefas todos os dias para manter seu streak e ganhar bônus de XP!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}