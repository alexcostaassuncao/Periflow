import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

export default function ExpenseForm({ expense, onSave, onClose, clients, suppliers }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'software',
    cost_center: '',
    expense_type: 'fixa',
    value: 0,
    payment_method: 'pix',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    recurrence: 'mensal',
    supplier_id: '',
    client_id: '',
    status: 'pendente'
  });

  useEffect(() => {
    if (expense) setFormData(expense);
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">{expense ? 'Editar Despesa' : 'Nova Despesa'}</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div>
          <Label className="text-gray-400">Nome da Despesa *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-400">Categoria</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="trafego">Tráfego</SelectItem>
                <SelectItem value="servico">Serviço</SelectItem>
                <SelectItem value="estrutura">Estrutura</SelectItem>
                <SelectItem value="pessoal">Pessoal</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Tipo</Label>
            <Select value={formData.expense_type} onValueChange={(v) => setFormData(prev => ({ ...prev, expense_type: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="fixa">Fixa</SelectItem>
                <SelectItem value="variavel">Variável</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Valor *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
              className="bg-[#1a1a2e] border-white/10"
              required
            />
          </div>
          <div>
            <Label className="text-gray-400">Vencimento *</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Forma de Pagamento</Label>
            <Select value={formData.payment_method} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Recorrência</Label>
            <Select value={formData.recurrence} onValueChange={(v) => setFormData(prev => ({ ...prev, recurrence: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="pontual">Pontual</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-gray-400">Centro de Custo</Label>
          <Input
            value={formData.cost_center}
            onChange={(e) => setFormData(prev => ({ ...prev, cost_center: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Fornecedor (opcional)</Label>
            <Select value={formData.supplier_id || 'none'} onValueChange={(v) => setFormData(prev => ({ ...prev, supplier_id: v === 'none' ? '' : v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="none">Nenhum</SelectItem>
                {suppliers?.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Cliente (opcional)</Label>
            <Select value={formData.client_id || 'none'} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v === 'none' ? '' : v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="none">Nenhum</SelectItem>
                {clients?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button variant="outline" onClick={onClose} className="flex-1 border-white/10">
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit} className="flex-1 gradient-primary">
          Salvar
        </Button>
      </div>
    </>
  );
}