import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function SupplierForm({ supplier, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'pj',
    status: 'ativo',
    contact_name: '',
    email: '',
    phone: '',
    service_type: '',
    payment_method: 'pix',
    periodicity: 'mensal',
    average_value: 0,
    cost_center: '',
    is_also_client: false
  });

  useEffect(() => {
    if (supplier) setFormData(supplier);
  }, [supplier]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">{supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10"
              required
            />
          </div>
          <div>
            <Label className="text-gray-400">Tipo de Serviço</Label>
            <Input
              value={formData.service_type}
              onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
              placeholder="Ex: Tráfego, Impressão..."
              className="bg-[#1a1a2e] border-white/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Tipo</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
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
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-400">Contato</Label>
            <Input
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-400">E-mail</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-400">Telefone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
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
            <Label className="text-gray-400">Periodicidade</Label>
            <Select value={formData.periodicity} onValueChange={(v) => setFormData(prev => ({ ...prev, periodicity: v }))}>
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
          <div>
            <Label className="text-gray-400">Valor Médio</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.average_value}
              onChange={(e) => setFormData(prev => ({ ...prev, average_value: parseFloat(e.target.value) }))}
              className="bg-[#1a1a2e] border-white/10"
            />
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

        <div className="flex items-center gap-2">
          <Checkbox
            checked={formData.is_also_client}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_also_client: checked }))}
          />
          <Label className="text-gray-400">Este fornecedor também é cliente</Label>
        </div>
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button variant="outline" onClick={onClose} className="flex-1 border-white/10">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1 gradient-primary">
          Salvar
        </Button>
      </div>
    </>
  );
}