import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, ChevronDown, ChevronRight, History, RotateCcw, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { localApp } from '@/api/localClient';

const SQUAD_LABELS = {
  'Carteira C1': 'C1',
  'Carteira C2': 'C2',
  'Carteira C3': 'C3',
  'Projetos': '🗂️ Projetos',
  'Cancelado': '❌ Cancelado',
};

function parseHistory(obs) {
  if (!obs) return [];
  try {
    const parsed = JSON.parse(obs);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function ClienteCanceladoCard({ vinculo, onReativado }) {
  const [expanded, setExpanded] = useState(false);
  const [reativando, setReativando] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState('');
  const [saving, setSaving] = useState(false);

  const history = parseHistory(vinculo.observacoes);
  const squadsAnteriores = history.filter(h => h.de !== 'Sem carteira').map(h => h.de);
  const squadAnterior = squadsAnteriores[squadsAnteriores.length - 1] || 'Sem informação';
  const dataCancelamento = history.find(h => h.para === 'Cancelado')?.data;

  const handleReativar = async () => {
    if (!selectedSquad) return;
    setSaving(true);
    try {
      const user = await localApp.auth.me();
      const newEntry = {
        de: 'Cancelado',
        para: selectedSquad,
        usuario: user?.full_name || user?.email || 'Administrador',
        data: new Date().toISOString(),
      };
      const updatedHistory = [...history, newEntry];
      await localApp.entities.ClienteSquad.update(vinculo.id, {
        squad_nome: selectedSquad,
        tipo_cliente: selectedSquad === 'Projetos' ? 'campanha' : 'planejamento_recorrente',
        status: 'ativo',
        observacoes: JSON.stringify(updatedHistory),
      });
      onReativado?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-black/20 border border-red-500/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <XCircle className="w-4 h-4 text-red-400/60 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-400 line-through">{vinculo.workspace_nome}</p>
          {squadAnterior && squadAnterior !== 'Sem informação' && (
            <p className="text-xs text-gray-600">Squad anterior: {SQUAD_LABELS[squadAnterior] || squadAnterior}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 flex-shrink-0">
          {dataCancelamento && (
            <span>{new Date(dataCancelamento).toLocaleDateString('pt-BR')}</span>
          )}
          {history.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all"
              title="Ver histórico"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setReativando(!reativando)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Reativar
          </button>
        </div>
      </div>

      {/* Painel reativação */}
      <AnimatePresence>
        {reativando && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
              <p className="text-xs text-gray-400">Mover <strong className="text-white">{vinculo.workspace_nome}</strong> de volta para:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                  <SelectTrigger className="bg-[#0a0a0f] border-white/20 text-white h-9 text-sm w-full sm:w-52">
                    <SelectValue placeholder="Selecione a carteira..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carteira C1">Carteira C1</SelectItem>
                    <SelectItem value="Carteira C2">Carteira C2</SelectItem>
                    <SelectItem value="Carteira C3">Carteira C3</SelectItem>
                    <SelectItem value="Projetos">🗂️ Projetos</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleReativar} disabled={!selectedSquad || saving} className="bg-green-600 hover:bg-green-700 text-white h-9 text-xs">
                    {saving
                      ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />Salvando...</>
                      : <><Check className="w-3 h-3 mr-1" />Confirmar reativação</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReativando(false)} className="text-gray-400 hover:text-white h-9 text-xs">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-gray-600">O histórico anterior será preservado.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Histórico de alterações */}
      <AnimatePresence>
        {expanded && history.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
              <p className="text-[10px] text-gray-600 uppercase tracking-wide font-medium mb-2">Histórico</p>
              {[...history].reverse().map((entry, i) => (
                <div key={i} className="text-xs text-gray-500 flex flex-wrap items-center gap-2 bg-white/2 rounded px-3 py-1.5">
                  <span className="text-gray-600">{SQUAD_LABELS[entry.de] || entry.de}</span>
                  <span className="text-gray-700">→</span>
                  <span className={entry.para === 'Cancelado' ? 'text-red-400' : 'text-white'}>{SQUAD_LABELS[entry.para] || entry.para}</span>
                  <span className="ml-auto text-gray-700 text-[10px]">{entry.usuario} · {new Date(entry.data).toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ClientesCancelados({ clienteSquads, onReativado }) {
  const [expanded, setExpanded] = useState(true);

  const cancelados = clienteSquads.filter(cs => cs.squad_nome === 'Cancelado');

  if (cancelados.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-red-500/10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-5 hover:bg-white/2 transition-colors text-left"
      >
        <XCircle className="w-5 h-5 text-red-400/60 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-gray-300">Clientes Cancelados</p>
          <p className="text-xs text-gray-600">Controle interno — não entram nos cálculos de produtividade</p>
        </div>
        <span className="text-xs bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full font-medium">{cancelados.length} cliente{cancelados.length !== 1 ? 's' : ''}</span>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2 border-t border-white/5">
              <p className="text-xs text-gray-600 pt-3 pb-1">
                Estes clientes foram removidos das carteiras ativas. Para reativar, clique em <strong className="text-green-400">Reativar</strong>.
              </p>
              {cancelados.map(v => (
                <ClienteCanceladoCard key={v.id} vinculo={v} onReativado={onReativado} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}