import React, { useEffect, useState } from 'react';
import { localApp } from '@/api/localClient';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart2, CheckCircle2, AlertTriangle, Clock, Users,
  XCircle, TrendingUp, Trophy, ArrowRight, CalendarDays
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLOR = (pct) => pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

const SQUAD_OPTIONS = [
  { value: 'all', label: 'Todos os squads' },
  { value: 'c1', label: 'Carteira C1' },
  { value: 'c2', label: 'Carteira C2' },
  { value: 'c3', label: 'Carteira C3' },
  { value: 'gerencia', label: 'Gerência' },
  { value: 'videomaker', label: 'Videomaker' },
  { value: 'comercial', label: 'Comercial' },
];

function KpiCard({ icon: Icon, label, value, color = 'text-[#ff5000]', bg = 'bg-[#ff5000]/10', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-xl p-4"
    >
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4.5 h-4.5 ${color}`} size={18} />
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  );
}

function ProgressBar({ label, pct, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-300 truncate mr-2">{label}</span>
        <span className="font-bold flex-shrink-0" style={{ color: COLOR(pct) }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: COLOR(pct) }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay }}
        />
      </div>
    </motion.div>
  );
}

export default function SquadPerformancePanel({ employee, isAdmin, currentUserCarteira, selectedMes }) {
  const [records, setRecords] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [clienteSquads, setClienteSquads] = useState([]);
  // Para não-admins, o filtro já começa travado na carteira do usuário
  const initialFilter = (!isAdmin && currentUserCarteira && currentUserCarteira !== 'all')
    ? currentUserCarteira
    : 'all';
  const [squadFilter, setSquadFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [selectedMes]);

  // Sincroniza se carteira chegar depois do mount
  useEffect(() => {
    if (!isAdmin && currentUserCarteira && currentUserCarteira !== 'all') {
      setSquadFilter(currentUserCarteira);
    }
  }, [isAdmin, currentUserCarteira]);

  const load = async () => {
    setLoading(true);
    const filters = selectedMes ? { mes_referencia: selectedMes } : {};
    const [recs, ws, cs] = await Promise.all([
      localApp.entities.EkyteRecord.filter(filters, '-created_date', 500),
      localApp.entities.EkyteWorkspace.filter(selectedMes ? { mes_referencia: selectedMes } : {}, '-created_date', 200),
      localApp.entities.ClienteSquad.filter({ status: 'ativo' }),
    ]);
    setRecords(recs);
    setWorkspaces(ws);
    setClienteSquads(cs);
    setLoading(false);
  };

  // ── Squad mapping from ClienteSquad ────────────────────────────────────────
  const wsSquadMap = {};
  clienteSquads.forEach(cs => {
    wsSquadMap[cs.workspace_nome?.toUpperCase()?.trim()] = cs.squad_nome;
  });

  const getSquad = (rec) => {
    const sq = (rec.squad || '').toLowerCase().trim();
    if (sq) return sq;
    const ws = (rec.workspace || rec.cliente || '').toUpperCase().trim();
    const mapped = wsSquadMap[ws];
    if (mapped) return mapped.toLowerCase();
    return 'sem_squad';
  };

  // ── Filter records by squad ─────────────────────────────────────────────────
  const filteredRecs = records.filter(r => {
    if (squadFilter === 'all') return true;
    const sq = getSquad(r);
    return sq.includes(squadFilter.toLowerCase()) || sq === squadFilter.toLowerCase();
  });

  // ── Compute stats ───────────────────────────────────────────────────────────
  const isConcluido = (s) => ['concluido', 'concluída', 'concluida', 'concluído'].includes((s || '').toLowerCase().trim());
  const isAtrasado = (s) => (s || '').toLowerCase().trim() === 'atrasado';
  const isPendente = (s) => !isConcluido(s) && !isAtrasado(s);

  const totalTasks = filteredRecs.length;
  const concluidas = filteredRecs.filter(r => isConcluido(r.status)).length;
  const atrasadas = filteredRecs.filter(r => isAtrasado(r.status)).length;
  const pendentes = filteredRecs.filter(r => isPendente(r.status)).length;
  const pctGeral = totalTasks > 0 ? Math.round((concluidas / totalTasks) * 100) : 0;

  // Clientes ativos vinculados ao squad filtrado
  const clientesDoFiltro = squadFilter === 'all'
    ? clienteSquads
    : clienteSquads.filter(cs => cs.squad_nome?.toLowerCase().includes(squadFilter.toLowerCase()));
  const clientesAtivos = clientesDoFiltro.filter(cs => cs.tipo_cliente !== 'cancelamento').length;
  const clientesCancelados = clientesDoFiltro.filter(cs => cs.tipo_cliente === 'cancelamento').length;

  // ── By squad breakdown ──────────────────────────────────────────────────────
  const bySquad = {};
  records.forEach(r => {
    const sq = getSquad(r);
    if (!bySquad[sq]) bySquad[sq] = { total: 0, concluidas: 0, atrasadas: 0 };
    bySquad[sq].total++;
    if (isConcluido(r.status)) bySquad[sq].concluidas++;
    if (isAtrasado(r.status)) bySquad[sq].atrasadas++;
  });

  const squadList = Object.entries(bySquad)
    .filter(([, d]) => d.total > 0)
    .map(([name, d]) => ({
      name,
      pct: Math.round((d.concluidas / d.total) * 100),
      total: d.total,
      concluidas: d.concluidas,
      atrasadas: d.atrasadas,
    }))
    .sort((a, b) => b.pct - a.pct);

  const bestSquad = squadList[0];

  // ── By responsavel ──────────────────────────────────────────────────────────
  const byResp = {};
  filteredRecs.forEach(r => {
    const resp = r.responsavel || 'Sem responsável';
    if (!byResp[resp]) byResp[resp] = { total: 0, concluidas: 0 };
    byResp[resp].total++;
    if (isConcluido(r.status)) byResp[resp].concluidas++;
  });

  const respList = Object.entries(byResp)
    .filter(([, d]) => d.total > 0)
    .map(([name, d]) => ({ name, pct: Math.round((d.concluidas / d.total) * 100), total: d.total, concluidas: d.concluidas }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = squadList.slice(0, 6).map(s => ({
    name: s.name.replace('carteira ', '').toUpperCase(),
    Concluídas: s.concluidas,
    Atrasadas: s.atrasadas,
    Pendentes: s.total - s.concluidas - s.atrasadas,
  }));

  // ── By cliente ──────────────────────────────────────────────────────────────
  const byCliente = {};
  filteredRecs.forEach(r => {
    const cl = r.cliente || r.workspace || 'N/A';
    if (!byCliente[cl]) byCliente[cl] = { total: 0, concluidas: 0 };
    byCliente[cl].total++;
    if (isConcluido(r.status)) byCliente[cl].concluidas++;
  });
  const clienteList = Object.entries(byCliente)
    .map(([name, d]) => ({ name, pct: Math.round((d.concluidas / d.total) * 100), total: d.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <BarChart2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">Nenhum dado de atividade encontrado para este período.</p>
        <Link to="/Importacoes" className="text-xs text-[#ff5000] hover:underline flex items-center justify-center gap-1 mt-2">
          Importar atividades <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Filtro */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[#ff5000]" />
          Desempenho por Squad
        </h3>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Select value={squadFilter} onValueChange={setSquadFilter}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white text-sm w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SQUAD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Link to="/Importacoes" className="text-xs text-[#ff5000] hover:underline flex items-center gap-1">
            Ver detalhes <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={BarChart2} label="Conclusão Geral" value={`${pctGeral}%`} color={pctGeral >= 80 ? 'text-green-400' : pctGeral >= 60 ? 'text-yellow-400' : 'text-red-400'} bg={pctGeral >= 80 ? 'bg-green-500/10' : 'bg-yellow-500/10'} delay={0} />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={concluidas} color="text-green-400" bg="bg-green-500/10" delay={0.05} />
        <KpiCard icon={Clock} label="Pendentes" value={pendentes} color="text-blue-400" bg="bg-blue-500/10" delay={0.1} />
        <KpiCard icon={AlertTriangle} label="Atrasadas" value={atrasadas} color="text-red-400" bg="bg-red-500/10" delay={0.15} />
        <KpiCard icon={Users} label="Clientes Ativos" value={clientesAtivos} color="text-[#ff5000]" bg="bg-[#ff5000]/10" delay={0.2} />
        <KpiCard icon={XCircle} label="Cancelamentos" value={clientesCancelados} color="text-gray-400" bg="bg-gray-500/10" delay={0.25} />
      </div>

      {/* Best Squad */}
      {bestSquad && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm">
            <span className="text-yellow-400 font-bold">Melhor squad do período:</span>{' '}
            <span className="text-white font-semibold">{bestSquad.name.toUpperCase()}</span>
            <span className="text-gray-400"> — {bestSquad.pct}% de conclusão ({bestSquad.concluidas}/{bestSquad.total} tarefas)</span>
          </p>
        </div>
      )}

      {/* Gráfico de barras por squad */}
      {isAdmin && chartData.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h4 className="font-semibold text-sm text-gray-300 mb-4">Tarefas por Squad</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="Concluídas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Atrasadas" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Pendentes" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Progress bars por squad (visão admin) */}
      {isAdmin && squadList.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h4 className="font-semibold text-sm text-gray-300">Progresso por Squad</h4>
          {squadList.map((sq, i) => (
            <ProgressBar key={sq.name} label={`${sq.name.toUpperCase()} (${sq.total} tarefas)`} pct={sq.pct} delay={i * 0.05} />
          ))}
        </div>
      )}

      {/* Ranking de colaboradores */}
      {respList.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h4 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#ff5000]" />
            Desempenho por Colaborador
            {!isAdmin && <span className="text-xs text-gray-600">(seu squad)</span>}
          </h4>
          <div className="space-y-2">
            {respList.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4 flex-shrink-0">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-300 truncate">{r.name}</span>
                    <span className="font-bold ml-2 flex-shrink-0" style={{ color: COLOR(r.pct) }}>
                      {r.pct}% <span className="text-gray-600">({r.concluidas}/{r.total})</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: COLOR(r.pct) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${r.pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.04 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clientes por conclusão */}
      {clienteList.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h4 className="font-semibold text-sm text-gray-300">Clientes — % Conclusão das Demandas</h4>
          <div className="space-y-2">
            {clienteList.map((cl, i) => (
              <ProgressBar key={cl.name} label={`${cl.name} (${cl.total} tarefas)`} pct={cl.pct} delay={i * 0.04} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}