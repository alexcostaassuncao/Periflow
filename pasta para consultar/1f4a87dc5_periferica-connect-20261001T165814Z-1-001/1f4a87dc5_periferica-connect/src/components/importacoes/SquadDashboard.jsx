import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronRight, ChevronDown, TrendingUp, AlertTriangle, CheckCircle2, Clock, Unlink, FolderKanban } from 'lucide-react';
import { getSquadForWorkspace } from '@/lib/squadMapping';
import ClienteVinculoRow from './ClienteVinculoRow';
import ClienteEditRow from './ClienteEditRow';
import ClientesCancelados from './ClientesCancelados';

// % = concluídas ÷ (concluídas + pendentes + atrasadas) × 100
// pendentes = max(novas - concluídas, 0)
// 100% só quando pendentes=0, atrasadas=0, concluídas>0
function pct(concluidas, novas, atrasadas) {
  const c = concluidas || 0;
  const n = novas || 0;
  const a = atrasadas || 0;
  const pendentes = Math.max(n - c, 0);
  const denominador = c + pendentes + a;
  if (denominador === 0) return 0;
  return Math.round((c / denominador) * 100);
}

function pctColor(p) {
  if (p >= 80) return '#22c55e';
  if (p >= 60) return '#f59e0b';
  return '#ef4444';
}

function ClienteRow({ ws }) {
  const p = pct(ws.concluidas, ws.novas, ws.atrasaram);
  const c = pctColor(p);
  return (
    <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{ws.workspace}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" />{ws.novas} novas</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" />{ws.concluidas} concluídas</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-400" />{Math.max((ws.novas || 0) - (ws.concluidas || 0), 0)} pendentes</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" />{ws.atrasaram} atrasaram</span>
        {ws.qtd_pecas > 0 && <span className="text-gray-500">{ws.qtd_pecas} peças</span>}
        {ws.qtd_publicacoes > 0 && <span className="text-gray-500">{ws.qtd_publicacoes} pub.</span>}
      </div>
      <div className="flex items-center gap-2 min-w-[80px]">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: c }} />
        </div>
        <span className="text-xs font-bold" style={{ color: c }}>{p}%</span>
      </div>
    </div>
  );
}

function SquadCard({ squadName, workspaces, delay, vinculoByWs, onVinculoSaved }) {
  const [open, setOpen] = useState(false);

  const totalNovas = workspaces.reduce((s, w) => s + (w.novas || 0), 0);
  const totalConcluidas = workspaces.reduce((s, w) => s + (w.concluidas || 0), 0);
  const totalAtrasaram = workspaces.reduce((s, w) => s + (w.atrasaram || 0), 0);
  const p = pct(totalConcluidas, totalNovas, totalAtrasaram);
  const c = pctColor(p);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 hover:bg-white/3 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{squadName}</p>
          <p className="text-xs text-gray-400">{workspaces.length} clientes · {totalNovas} novas · {totalAtrasaram} atrasaram</p>
        </div>
        <div className="text-right mr-2">
          <p className="text-2xl font-black" style={{ color: c }}>{p}%</p>
          <p className="text-xs text-gray-500">{totalConcluidas}/{totalNovas + totalAtrasaram}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {/* barra de progresso */}
      <div className="px-5 pb-0">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: c }}
            initial={{ width: 0 }}
            animate={{ width: `${p}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1 pb-3">
          <span>{totalAtrasaram} atrasaram</span>
          <span>{Math.max(0, totalNovas - totalConcluidas)} pendentes</span>
          <span className="text-red-400">{totalAtrasaram} atrasaram</span>
        </div>
      </div>

      {/* Detalhamento por cliente */}
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <div className="border-t border-white/5 pt-3 mb-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Clientes desta carteira</p>
          </div>
          {workspaces
            .sort((a, b) => pct(b.concluidas, b.novas, b.atrasaram) - pct(a.concluidas, a.novas, a.atrasaram))
            .map(ws => {
              const vinculo = vinculoByWs?.[ws.workspace.trim().toUpperCase()];
              return (
                <ClienteEditRow
                  key={ws.id || ws.workspace}
                  ws={ws}
                  currentSquad={squadName}
                  vinculo={vinculo}
                  onVinculoSaved={onVinculoSaved}
                />
              );
            })}
        </div>
      )}
    </motion.div>
  );
}

export default function SquadDashboard({ workspaces, clienteSquads = [], onVinculoSaved, userCarteira, isAdmin }) {
  // Normaliza nome para lookup
  const normalize = (s = '') =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

  // Mapa de vínculos manuais: workspace_nome normalizado => squad_nome
  const vinculoMap = {};
  const vinculoByWs = {}; // workspace_nome raw => ClienteSquad record
  clienteSquads.forEach(cs => {
    const norm = normalize(cs.workspace_nome);
    vinculoMap[norm] = cs.squad_nome;
    vinculoByWs[cs.workspace_nome] = cs;
  });

  const squads = {};
  const projetos = [];
  const cancelados = [];
  const semSquad = [];

  workspaces.forEach(ws => {
    const normWs = normalize(ws.workspace);
    const wsNormUpper = ws.workspace.trim().toUpperCase();

    // 1. Verificar vínculo manual por nome normalizado
    const vinculoManual = vinculoMap[normWs] || vinculoMap[wsNormUpper];

    if (vinculoManual) {
      if (vinculoManual === 'Cancelado') {
        cancelados.push(ws);
      } else if (vinculoManual === 'Projetos') {
        projetos.push(ws);
      } else {
        if (!squads[vinculoManual]) squads[vinculoManual] = [];
        squads[vinculoManual].push(ws);
      }
      return;
    }

    // 2. Fallback: mapeamento fixo
    const squadFixo = getSquadForWorkspace(ws.workspace);
    if (squadFixo) {
      if (!squads[squadFixo]) squads[squadFixo] = [];
      squads[squadFixo].push(ws);
    } else {
      semSquad.push(ws);
    }
  });

  // Se não for admin, filtra apenas o squad/carteira vinculado ao usuário
  const normalizeCarteira = (s = '') =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '').trim();

  const filterByUserCarteira = (entries) => {
    if (isAdmin || !userCarteira || userCarteira === 'all') return entries;
    const userNorm = normalizeCarteira(userCarteira);
    return entries.filter(([name]) => normalizeCarteira(name).includes(userNorm) || userNorm.includes(normalizeCarteira(name)));
  };

  const allSquadEntries = Object.entries(squads).sort((a, b) => a[0].localeCompare(b[0]));
  const squadEntries = filterByUserCarteira(allSquadEntries);

  // Usuário não-admin só vê projetos e sem-squad se não tiver carteira vinculada
  const showProjetosESemSquad = isAdmin || !userCarteira || userCarteira === 'all';

  return (
    <div className="space-y-6">
      {/* Badge da carteira para não-admin */}
      {!isAdmin && userCarteira && userCarteira !== 'all' && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff5000]/10 border border-[#ff5000]/20 w-fit">
          <Users className="w-4 h-4 text-[#ff5000]" />
          <span className="text-sm font-medium text-[#ff5000]">Visualizando: {userCarteira.toUpperCase()}</span>
        </div>
      )}

      {/* Squads configurados */}
      {squadEntries.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#ff5000]" />
            Desempenho por Carteira/Squad
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {squadEntries.map(([name, wsList], i) => (
              <SquadCard key={name} squadName={name} workspaces={wsList} delay={i * 0.07} vinculoByWs={vinculoByWs} onVinculoSaved={onVinculoSaved} />
            ))}
          </div>
        </div>
      )}

      {/* Projetos — só admin ou usuários sem carteira */}
      {showProjetosESemSquad && projetos.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-purple-400" />
            Projetos
            <span className="text-sm text-gray-500 font-normal">— demandas avulsas e pontuais</span>
          </h2>
          <SquadCard squadName="Projetos" workspaces={projetos} delay={0.1} vinculoByWs={vinculoByWs} onVinculoSaved={onVinculoSaved} />
        </div>
      )}

      {/* Sem squad — só admin */}
      {isAdmin && semSquad.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Unlink className="w-5 h-5 text-yellow-500" />
            Outros clientes
            <span className="text-sm text-gray-500 font-normal">— não mapeados nas carteiras</span>
            <span className="ml-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">{semSquad.length}</span>
          </h2>
          <div className="glass-card rounded-2xl p-4 space-y-2">
            <p className="text-xs text-gray-500 mb-3 pb-3 border-b border-white/5">
              Clique em <strong className="text-[#ff5000]">Vincular</strong> para associar o cliente a uma carteira. O sistema vai lembrar nas próximas importações.
            </p>
            {semSquad
              .sort((a, b) => pct(b.concluidas, b.novas, b.atrasaram) - pct(a.concluidas, a.novas, a.atrasaram))
              .map(ws => (
                <ClienteVinculoRow
                  key={ws.id || ws.workspace}
                  ws={ws}
                  existingVinculo={vinculoByWs[ws.workspace.trim().toUpperCase()]}
                  onVinculoSaved={onVinculoSaved}
                />
              ))}
          </div>
        </div>
      )}

      {/* Clientes cancelados — só admin */}
      {isAdmin && <ClientesCancelados clienteSquads={clienteSquads} onReativado={onVinculoSaved} />}

      {squadEntries.length === 0 && (showProjetosESemSquad ? projetos.length === 0 && semSquad.length === 0 : true) && (
        <div className="glass-card rounded-2xl p-12 text-center text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum dado para este mês</p>
        </div>
      )}
    </div>
  );
}