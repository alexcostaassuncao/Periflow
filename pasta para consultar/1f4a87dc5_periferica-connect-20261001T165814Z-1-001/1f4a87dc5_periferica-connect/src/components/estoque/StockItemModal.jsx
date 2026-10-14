import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { value: 'informatica', label: 'Informática' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'audio_video', label: 'Áudio/Vídeo' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'estudio', label: 'Estúdio' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'outros', label: 'Outros' },
];

const STATUSES = [
  { value: 'em_estoque', label: 'Em Estoque' },
  { value: 'com_funcionario', label: 'Com Funcionário' },
  { value: 'em_manutencao', label: 'Em Manutenção' },
  { value: 'descartado', label: 'Descartado' },
];

const defaultForm = {
  name: '',
  code: '',
  category: 'outros',
  description: '',
  quantity: 1,
  status: 'em_estoque',
  location: '',
  responsible_email: '',
  responsible_name: '',
  observations: '',
};

export default function StockItemModal({ item, employees, onSave, onClose }) {
  const [form, setForm] = useState(defaultForm);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        code: item.code || '',
        category: item.category || 'outros',
        description: item.description || '',
        quantity: item.quantity ?? 1,
        status: item.status || 'em_estoque',
        location: item.location || '',
        responsible_email: item.responsible_email || '',
        responsible_name: item.responsible_name || '',
        observations: item.observations || '',
      });
    }
  }, [item]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleResponsibleChange = (email) => {
    const emp = employees.find(e => e.user_id === email);
    set('responsible_email', email);
    set('responsible_name', emp?.position || email);
    if (email) set('status', 'com_funcionario');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form, reason);
    setSaving(false);
  };

  const activeEmployees = employees.filter(e => e.employee_status === 'ativo' || !e.employee_status);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[#ff5000]" />
              <h2 className="font-bold text-lg">{item ? 'Editar Item' : 'Novo Item'}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Nome e Código */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nome do Item *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Ex: Notebook Dell"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff5000]/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Código / Patrimônio</label>
                <input
                  value={form.code}
                  onChange={e => set('code', e.target.value)}
                  placeholder="Ex: PAT-0042"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff5000]/50"
                />
              </div>
            </div>

            {/* Categoria e Quantidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Categoria *</label>
                <Select value={form.category} onValueChange={v => set('category', v)}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Quantidade</label>
                <input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={e => set('quantity', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff5000]/50"
                />
              </div>
            </div>

            {/* Status e Localização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status / Localização</label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Localização Física</label>
                <input
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="Ex: Sala de reuniões, Armário 2"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff5000]/50"
                />
              </div>
            </div>

            {/* Funcionário responsável */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Funcionário Responsável</label>
              <Select
                value={form.responsible_email || 'nenhum'}
                onValueChange={v => handleResponsibleChange(v === 'nenhum' ? '' : v)}
              >
                <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                  <SelectValue placeholder="Selecionar funcionário..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">— Nenhum —</SelectItem>
                  {activeEmployees.map(e => (
                    <SelectItem key={e.user_id} value={e.user_id}>
                      {e.position || e.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                placeholder="Descrição detalhada do item..."
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff5000]/50 resize-none"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Observações</label>
              <textarea
                value={form.observations}
                onChange={e => set('observations', e.target.value)}
                rows={2}
                placeholder="Observações adicionais..."
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff5000]/50 resize-none"
              />
            </div>

            {/* Motivo da alteração (edição) */}
            {item && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Motivo da Alteração</label>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Opcional: descreva o motivo da alteração"
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#ff5000]/50"
                />
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 border border-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="flex-1 gradient-primary text-white"
              >
                {saving ? 'Salvando...' : item ? 'Salvar Alterações' : 'Cadastrar Item'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}