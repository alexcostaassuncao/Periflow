import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Pencil, X, Check, History } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { localApp } from '@/api/localClient';

// % = concluídas ÷ (concluídas + pendentes + atrasadas) × 100
// pendentes = max(novas - concluídas, 0)
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

const SQUAD_LABELS = {
  'Carteira C1': 'Carteira C1',
  'Carteira C2': 'Carteira C2',
  'Carteira C3': 'Carteira C3',
  'Projetos': '🗂️ Projetos',
  'Cancelado': '❌ Cancelado',
};

export default function ClienteEditRow({ ws, currentSquad, vinculo, onVinculoSaved }) {
  const [editing, setEditing] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState(currentSquad || '');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const p = pct(ws.concluidas, ws.novas, ws.atrasaram);
  const c = pctColor(p);

  // Histórico de alterações armazenado em observacoes como JSON
  const parseHistory = () => {
    if (!vinculo?.observacoes) return [];
    try {
      const parsed = JSON.parse(vinculo.observacoes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const history = parseHistory();

  const handleSave = async () => {
    if (!selectedSquad || selectedSquad === currentSquad) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const user = await localApp.auth.me();

      // Montar novo registro de histórico
      const newEntry = {
        de: currentSquad || 'Sem carteira',
        para: selectedSquad,
        usuario: user?.full_name || user?.email || 'Administrador',
        data: new Date().toISOString(),
      };

      const updatedHistory = [...history, newEntry];

      const data = {
        workspace_nome: ws.workspace.trim().toUpperCase(),
        squad_nome: selectedSquad,
        tipo_cliente: selectedSquad === 'Cancelado' ? 'cancelamento' : selectedSquad === 'Projetos' ? 'campanha' : 'planejamento_recorrente',
        status: selectedSquad === 'Cancelado' ? 'inativo' : 'ativo',
        observacoes: JSON.stringify(updatedHistory),
      };

      if (vinculo?.id) {
        await localApp.entities.ClienteSquad.update(vinculo.id, data);
      } else {
        await localApp.entities.ClienteSquad.create(data);
      }

      setEditing(false);
      onVinculoSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
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
        <div className="flex items-center gap-1 flex-shrink-0">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              title="Ver histórico de alterações"
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => { setEditing(!editing); setSelectedSquad(currentSquad || ''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
        </div>
      </div>

      {/* Painel de edição */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
              <p className="text-xs text-gray-400">
                Mover <strong className="text-white">{ws.workspace}</strong> para outra carteira:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 items-start">
                <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                  <SelectTrigger className="bg-[#0a0a0f] border-white/20 text-white h-9 text-sm w-full sm:w-56">
                    <SelectValue placeholder="Selecione a carteira..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carteira C1">Carteira C1</SelectItem>
                    <SelectItem value="Carteira C2">Carteira C2</SelectItem>
                    <SelectItem value="Carteira C3">Carteira C3</SelectItem>
                    <SelectItem value="Projetos">🗂️ Projetos</SelectItem>
                    <SelectItem value="Cancelado">❌ Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {currentSquad && selectedSquad && selectedSquad !== currentSquad && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1 mt-2 sm:mt-2">
                    <span className="text-gray-500">{currentSquad}</span>
                    <span>→</span>
                    <span>{SQUAD_LABELS[selectedSquad] || selectedSquad}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!selectedSquad || saving || selectedSquad === currentSquad}
                  className="gradient-primary text-white h-8 text-xs"
                >
                  {saving
                    ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />Salvando...</>
                    : <><Check className="w-3 h-3 mr-1" />Confirmar alteração</>}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  className="text-gray-400 hover:text-white h-8 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />Cancelar
                </Button>
              </div>
              <p className="text-[10px] text-gray-600">O vínculo será atualizado nas próximas importações automaticamente.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Histórico de alterações */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
                <History className="w-3 h-3" /> Histórico de alterações
              </p>
              {[...history].reverse().map((entry, i) => (
                <div key={i} className="text-xs text-gray-400 flex flex-wrap items-center gap-2 bg-white/3 rounded-lg px-3 py-2">
                  <span className="text-gray-500 line-through">{entry.de}</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-white font-medium">{SQUAD_LABELS[entry.para] || entry.para}</span>
                  <span className="ml-auto text-gray-600 text-[10px]">{entry.usuario} · {new Date(entry.data).toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}