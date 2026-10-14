import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Link2, X, Check, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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

const SQUADS = ['Carteira C1', 'Carteira C2', 'Carteira C3', 'Cancelado'];

export default function ClienteVinculoRow({ ws, existingVinculo, onVinculoSaved }) {
  const [editing, setEditing] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState('');
  const [apelido, setApelido] = useState(ws.workspace);
  const [saving, setSaving] = useState(false);

  const p = pct(ws.concluidas, ws.novas, ws.atrasaram);
  const c = pctColor(p);

  const handleSave = async () => {
    if (!selectedSquad) return;
    setSaving(true);
    try {
      const data = {
        workspace_nome: ws.workspace.trim().toUpperCase(),
        squad_nome: selectedSquad,
        tipo_cliente: selectedSquad === 'Cancelado' ? 'cancelamento' : selectedSquad === 'Projetos' ? 'campanha' : 'planejamento_recorrente',
        status: selectedSquad === 'Cancelado' ? 'inativo' : 'ativo',
        observacoes: apelido !== ws.workspace ? `Nome interno: ${apelido}` : '',
      };

      if (existingVinculo) {
        await localApp.entities.ClienteSquad.update(existingVinculo.id, data);
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
        </div>
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: c }} />
          </div>
          <span className="text-xs font-bold" style={{ color: c }}>{p}%</span>
        </div>
        <button
          onClick={() => { setEditing(!editing); setSelectedSquad(''); setApelido(ws.workspace); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff5000]/10 hover:bg-[#ff5000]/20 text-[#ff5000] text-xs font-medium transition-all flex-shrink-0"
        >
          <Link2 className="w-3 h-3" />
          Vincular
        </button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
              <p className="text-xs text-gray-400">Vincular <strong className="text-white">{ws.workspace}</strong> a:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                  <SelectTrigger className="bg-[#0a0a0f] border-white/20 text-white h-9 text-sm">
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
                <Input
                  placeholder="Nome interno/apelido (opcional)"
                  value={apelido}
                  onChange={e => setApelido(e.target.value)}
                  className="bg-[#0a0a0f] border-white/20 text-white placeholder:text-gray-600 h-9 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!selectedSquad || saving}
                  className="gradient-primary text-white h-8 text-xs"
                >
                  {saving
                    ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />Salvando...</>
                    : <><Check className="w-3 h-3 mr-1" />Salvar vínculo</>}
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
              <p className="text-[10px] text-gray-600">O sistema vai lembrar deste vínculo nas próximas importações.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}