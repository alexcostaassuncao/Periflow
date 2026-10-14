import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, X } from 'lucide-react';
import ContractPrint from './ContractPrint';

export default function ContractForm({ contract, onSave, onClose }) {
  const [plans, setPlans] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [formData, setFormData] = useState(contract || {
    contract_number: `CTR-${Date.now()}`,
    client_name: '',
    client_cpf_cnpj: '',
    client_address: '',
    client_phone: '',
    client_email: '',
    plan_id: '',
    services: '',
    monthly_value: 0,
    contract_duration: 12,
    start_date: '',
    end_date: '',
    payment_method: 'pix',
    payment_day: 10,
    status: 'ativo',
    notes: ''
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const plansData = await localApp.entities.Plan.filter({ status: 'ativo' });
    setPlans(plansData);
  };

  const handleSubmit = async () => {
    if (!formData.client_name || !formData.monthly_value || !formData.start_date) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (contract) {
      await localApp.entities.Contract.update(contract.id, formData);
    } else {
      await localApp.entities.Contract.create(formData);
    }
    
    onSave?.();
    onClose();
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  if (showPrintPreview) {
    return <ContractPrint contract={{ ...formData, id: contract?.id }} />;
  }

  return (
    <div className="overflow-y-auto max-h-[80vh]">
      <div className="flex items-center justify-between mb-6 p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">{contract ? 'Editar' : 'Novo'} Contrato</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 p-6">
        {/* Cliente */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Nome/Razão Social *</Label>
            <Input
              value={formData.client_name}
              onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">CPF/CNPJ</Label>
            <Input
              value={formData.client_cpf_cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, client_cpf_cnpj: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-300">Telefone</Label>
            <Input
              value={formData.client_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">E-mail</Label>
            <Input
              type="email"
              value={formData.client_email}
              onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Endereço</Label>
            <Input
              value={formData.client_address}
              onChange={(e) => setFormData(prev => ({ ...prev, client_address: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-gray-300">Plano</Label>
          <Select value={formData.plan_id} onValueChange={(v) => setFormData(prev => ({ ...prev, plan_id: v }))}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10">
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name} - R$ {plan.price}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Serviços Contratados</Label>
          <Textarea
            value={formData.services}
            onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10 text-white min-h-[100px]"
            placeholder="Descreva os serviços incluídos no contrato..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-300">Valor Mensal *</Label>
            <Input
              type="number"
              value={formData.monthly_value}
              onChange={(e) => setFormData(prev => ({ ...prev, monthly_value: parseFloat(e.target.value) }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Duração (meses)</Label>
            <Input
              type="number"
              value={formData.contract_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, contract_duration: parseInt(e.target.value) }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Dia Vencimento</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={formData.payment_day}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_day: parseInt(e.target.value) }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Data Início *</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Data Término</Label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-gray-300">Forma de Pagamento</Label>
          <Select value={formData.payment_method} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="transferencia">Transferência</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="suspenso">Suspenso</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300">Observações Adicionais</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10 text-white"
            placeholder="Observações ou condições especiais do contrato..."
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
            Cancelar
          </Button>
          {contract && (
            <Button variant="outline" onClick={handlePrint} className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          )}
          <Button onClick={handleSubmit} className="flex-1 gradient-primary">
            Salvar Contrato
          </Button>
        </div>
      </div>
    </div>
  );
}