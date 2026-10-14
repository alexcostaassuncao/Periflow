import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIAS = [
  { value: 'informatica', label: 'Informática' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'eletronico', label: 'Eletrônico' },
  { value: 'audio_video', label: 'Áudio/Vídeo' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'ferramenta', label: 'Ferramenta' },
  { value: 'papelaria', label: 'Papelaria' },
  { value: 'outros', label: 'Outros' },
];

const EMPTY = {
  nome: '', codigo: '', categoria: 'outros', descricao: '',
  quantidade: 1, status: 'ativo', localizacao: 'estoque',
  funcionario_responsavel_email: '', funcionario_responsavel_nome: '',
  observacoes: '', motivo: '',
};

export default function ItemModal({ item, employees, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!item;

  useEffect(() => {
    if (item) setForm({ ...EMPTY, ...item, motivo: '' });
    else setForm(EMPTY);
  }, [item]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.nome.trim()) return;
    onSave(form);
  };

  const selectedEmployee = employees.find(e => e.user_email === form.funcionario_responsavel_email);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl glass-card rounded-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{isEditing ? 'Editar Item' : 'Novo Item'}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nome do Item *</label>
                <Input
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  placeholder="Ex: Notebook Dell Inspiron"
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Código / Patrimônio</label>
                <Input
                  value={form.codigo}
                  onChange={e => set('codigo', e.target.value)}
                  placeholder="Ex: PAT-001"
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
                <Select value={form.categoria} onValueChange={v => set('categoria', v)}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Quantidade</label>
                <Input
                  type="number"
                  min="0"
                  value={form.quantidade}
                  onChange={e => set('quantidade', Number(e.target.value))}
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Localização</label>
              <Select value={form.localizacao} onValueChange={v => set('localizacao', v)}>
                <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estoque">Em Estoque</SelectItem>
                  <SelectItem value="com_funcionario">Com Funcionário</SelectItem>
                  <SelectItem value="manutencao">Em Manutenção</SelectItem>
                  <SelectItem value="descartado">Descartado/Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.localizacao === 'com_funcionario' && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Funcionário Responsável</label>
                <Select
                  value={form.funcionario_responsavel_email}
                  onValueChange={v => {
                    const emp = employees.find(e => e.user_email === v);
                    set('funcionario_responsavel_email', v);
                    set('funcionario_responsavel_nome', emp?.full_name || '');
                  }}
                >
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectValue placeholder="Selecionar funcionário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.user_email} value={e.user_email}>
                        {e.full_name || e.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
              <textarea
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                placeholder="Descrição detalhada do item..."
                rows={2}
                className="w-full rounded-lg bg-[#1a1a2e] border border-white/10 text-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#ff5000]/50"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
                className="w-full rounded-lg bg-[#1a1a2e] border border-white/10 text-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#ff5000]/50"
              />
            </div>

            {isEditing && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Motivo da Alteração</label>
                <Input
                  value={form.motivo}
                  onChange={e => set('motivo', e.target.value)}
                  placeholder="Descreva o motivo desta alteração..."
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-gray-400">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.nome.trim()}
              className="flex-1 gradient-primary text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Item'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}