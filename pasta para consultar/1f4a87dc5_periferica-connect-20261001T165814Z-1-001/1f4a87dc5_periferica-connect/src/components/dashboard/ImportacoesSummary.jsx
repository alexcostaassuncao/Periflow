import React, { useEffect, useState } from 'react';
import { localApp } from '@/api/localClient';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

const getColor = (pct) => pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

export default function ImportacoesSummary() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const imports = await localApp.entities.ImportRecord.filter({ status: 'concluido' }, '-created_date', 1);
    if (!imports.length) return;
    const records = imports[0].records || [];

    const squads = {};
    records.forEach(r => {
      const sq = r.squad || 'Sem squad';
      if (!squads[sq]) squads[sq] = { c: 0, total: 0 };
      squads[sq].total++;
      const s = (r.status || '').toLowerCase();
      if (['concluido','concluída','concluida'].includes(s)) squads[sq].c++;
    });

    const squadList = Object.entries(squads).map(([name, d]) => ({
      name,
      pct: d.total > 0 ? Math.round((d.c / d.total) * 100) : 0,
    }));

    const totalC = records.filter(r => ['concluido','concluída','concluida'].includes((r.status||'').toLowerCase())).length;
    const totalA = records.filter(r => (r.status||'').toLowerCase() === 'atrasado').length;
    const pctGeral = records.length > 0 ? Math.round((totalC / records.length) * 100) : 0;
    const best = [...squadList].sort((a, b) => b.pct - a.pct)[0];
    const worst = [...squadList].sort((a, b) => b.pct - a.pct).pop();

    setStats({ squads: squadList, pctGeral, totalC, totalA, best, worst });
  };

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[#ff5000]" />
          Progresso dos Squads
        </h3>
        <Link
          to="/Importacoes"
          className="text-xs text-[#ff5000] hover:underline flex items-center gap-1"
        >
          Ver tudo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/20 p-3 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-[#ff5000]" />
          <div>
            <p className="text-xs text-gray-400">Geral</p>
            <p className="font-black text-lg" style={{ color: getColor(stats.pctGeral) }}>{stats.pctGeral}%</p>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-xs text-gray-400">Atrasadas</p>
            <p className="font-black text-lg text-red-400">{stats.totalA}</p>
          </div>
        </div>
      </div>

      {/* Squad bars */}
      <div className="space-y-2">
        {stats.squads.map(sq => (
          <div key={sq.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">{sq.name}</span>
              <span style={{ color: getColor(sq.pct) }} className="font-bold">{sq.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/40 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getColor(sq.pct) }}
                initial={{ width: 0 }}
                animate={{ width: `${sq.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>

      {stats.best && (
        <div className="text-xs text-gray-400 flex gap-4">
          <span>🏆 Melhor: <span className="text-green-400 font-medium">{stats.best.name}</span></span>
          {stats.worst && stats.worst.name !== stats.best.name && (
            <span>⚠️ Mais pendências: <span className="text-red-400 font-medium">{stats.worst.name}</span></span>
          )}
        </div>
      )}
    </motion.div>
  );
}