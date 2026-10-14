import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, DollarSign, FileSignature, Pencil, Trash2, CheckCircle, XCircle, Clock, ArrowRight, Eye, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import ProposalForm from '../components/comercial/ProposalForm';
import PlanForm from '../components/comercial/PlanForm';
import ContractForm from '../components/comercial/ContractForm';

export default function Comercial() {
  const [user, setUser] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [plans, setPlans] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [viewingProposal, setViewingProposal] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);
      
      const [proposalsData, plansData, contractsData] = await Promise.all([
        localApp.entities.Proposal.list('-created_date'),
        localApp.entities.Plan.filter({ status: 'ativo' }),
        localApp.entities.Contract.list('-created_date')
      ]);

      setProposals(proposalsData);
      setPlans(plansData);
      setContracts(contractsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setModalOpen(true);
  };

  const openViewModal = (proposal) => {
    setViewingProposal(proposal);
    setViewModalOpen(true);
  };

  const handlePrintProposal = (proposal) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Orçamento ${proposal.proposal_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            
            .header-container { display: flex; align-items: start; justify-content: space-between; margin-bottom: 40px; }
            .logo-section { flex: 0 0 auto; }
            .logo-placeholder { width: 80px; height: 80px; background: #ff5000; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; }
            .company-section { flex: 1; padding-left: 20px; }
            .company-name { font-size: 18px; font-weight: bold; color: #ff5000; margin-bottom: 8px; }
            .company-info { font-size: 11px; color: #666; line-height: 1.6; }
            
            .orcamento-title { text-align: center; font-size: 24px; font-weight: bold; color: #333; margin: 30px 0; border-bottom: 3px solid #ff5000; padding-bottom: 10px; }
            
            .client-section { margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            .client-section h2 { color: #ff5000; font-size: 16px; margin-bottom: 15px; }
            .client-section p { margin: 5px 0; font-size: 13px; }
            
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #ff5000; color: white; font-weight: bold; }
            td { background-color: white; }
            
            .totals { margin: 20px 0; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .totals-row.subtotal { border-top: 2px solid #ddd; padding-top: 15px; }
            .totals-row.final { border-top: 3px solid #ff5000; padding-top: 15px; margin-top: 10px; font-size: 20px; font-weight: bold; color: #ff5000; }
            
            .validity { text-align: center; margin-top: 50px; padding: 15px; background: #fff3e0; border: 2px solid #ff5000; border-radius: 8px; font-weight: bold; }
            
            @media print {
              body { padding: 20px; }
              .header-container { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="logo-section">
              <div class="logo-placeholder">P</div>
            </div>
            <div class="company-section">
              <div class="company-name">Periférica Agência de Publicidade Ltda - ME</div>
              <div class="company-info">
                <p><strong>CNPJ:</strong> 13.883.869/0003-35</p>
                <p><strong>Endereço:</strong> Criciúma, SC</p>
                <p><strong>Atividade:</strong> Agências de publicidade (CNAE M-7311-4/00)</p>
              </div>
            </div>
          </div>

          <div class="orcamento-title">Orçamento #${proposal.proposal_number}</div>

          <div class="client-section">
            <h2>Dados do Cliente</h2>
            <p><strong>Nome/Razão Social:</strong> ${proposal.client_name}</p>
            <p><strong>CPF/CNPJ:</strong> ${proposal.client_cpf_cnpj || '-'}</p>
            <p><strong>Telefone:</strong> ${proposal.client_phone || '-'}</p>
            <p><strong>E-mail:</strong> ${proposal.client_email || '-'}</p>
            <p><strong>Endereço:</strong> ${proposal.client_address || '-'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th style="width: 100px; text-align: center;">Quantidade</th>
                <th style="width: 140px;">Valor Unitário</th>
                <th style="width: 140px;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${proposal.items?.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td>R$ ${item.unit_price?.toFixed(2)}</td>
                  <td><strong>R$ ${item.total?.toFixed(2)}</strong></td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row subtotal">
              <span>Subtotal:</span>
              <span>R$ ${proposal.total_value?.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Desconto:</span>
              <span>R$ ${proposal.discount?.toFixed(2)}</span>
            </div>
            <div class="totals-row final">
              <span>Valor Final:</span>
              <span>R$ ${proposal.final_value?.toFixed(2)}</span>
            </div>
          </div>

          <div class="validity">
            Validade do Orçamento: ${proposal.valid_until ? format(new Date(proposal.valid_until), 'dd/MM/yyyy') : '-'}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const openDeleteModal = (item, type) => {
    setDeleteTarget({ item, type });
    setDeletePassword('');
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (deletePassword !== '0000') {
      alert('Senha incorreta');
      return;
    }

    const { item, type } = deleteTarget;
    const entityMap = {
      proposal: { entity: 'Proposal', state: setProposals, name: item.client_name },
      plan: { entity: 'Plan', state: setPlans, name: item.name },
      contract: { entity: 'Contract', state: setContracts, name: item.client_name }
    };

    const { entity, state, name } = entityMap[type];

    await localApp.entities[entity].delete(item.id);
    state(prev => prev.filter(i => i.id !== item.id));

    // Registra no log
    await localApp.entities.SystemLog.create({
      action: 'delete',
      entity_type: entity,
      entity_id: item.id,
      entity_name: name,
      user_email: user.email,
      user_name: user.full_name,
      details: { deleted_at: new Date().toISOString() }
    });

    setDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeletePassword('');
  };

  const createContractFromProposal = async (proposal) => {
    // Busca os serviços do plano se existir
    let servicesDescription = '';
    if (proposal.plan_id) {
      const plan = plans.find(p => p.id === proposal.plan_id);
      if (plan) {
        servicesDescription = plan.description || plan.name;
        if (plan.features && plan.features.length > 0) {
          servicesDescription += '\n\nInclusos:\n' + plan.features.join('\n');
        }
      }
    }

    // Se não tiver plano, monta descrição dos itens
    if (!servicesDescription && proposal.items && proposal.items.length > 0) {
      servicesDescription = proposal.items.map(item => 
        `${item.description} (${item.quantity}x)`
      ).join('\n');
    }

    const contractData = {
      contract_number: `CTR-${Date.now()}`,
      proposal_id: proposal.id,
      client_name: proposal.client_name,
      client_cpf_cnpj: proposal.client_cpf_cnpj,
      client_address: proposal.client_address,
      client_phone: proposal.client_phone,
      client_email: proposal.client_email,
      plan_id: proposal.plan_id,
      services: servicesDescription,
      monthly_value: proposal.final_value,
      contract_duration: 12,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      payment_day: 10,
      status: 'ativo'
    };

    const newContract = await localApp.entities.Contract.create(contractData);
    setContracts(prev => [newContract, ...prev]);
    
    // Abre o contrato em modo edição
    setEditingItem(newContract);
    setModalType('contract');
    setModalOpen(true);
    setViewModalOpen(false);
  };

  const statusColors = {
    rascunho: 'bg-gray-500',
    enviado: 'bg-blue-500',
    aprovado: 'bg-green-500',
    rejeitado: 'bg-red-500',
    convertido: 'bg-purple-500',
    ativo: 'bg-green-500',
    suspenso: 'bg-yellow-500',
    cancelado: 'bg-red-500'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comercial</h1>
          <p className="text-gray-400 mt-1">Gestão de orçamentos, planos e contratos</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a2e] border-b border-white/10">
          <TabsTrigger value="proposals" className="data-[state=active]:bg-[#ff5000]">
            <FileText className="w-4 h-4 mr-2" />
            Orçamentos ({proposals.length})
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-[#ff5000]">
            <DollarSign className="w-4 h-4 mr-2" />
            Planos ({plans.length})
          </TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-[#ff5000]">
            <FileSignature className="w-4 h-4 mr-2" />
            Contratos ({contracts.length})
          </TabsTrigger>
        </TabsList>

        {/* ORÇAMENTOS */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openModal('proposal')} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </div>

          <div className="grid gap-4">
            {proposals.map(proposal => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{proposal.client_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[proposal.status]}`}>
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">Orçamento #{proposal.proposal_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#ff5000]">
                      R$ {proposal.final_value?.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Válido até {proposal.valid_until && format(new Date(proposal.valid_until), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openViewModal(proposal)} className="bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
                    <Eye className="w-3 h-3 mr-1" />
                    Visualizar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openModal('proposal', proposal)} className="bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePrintProposal(proposal)} className="bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
                    <Printer className="w-3 h-3 mr-1" />
                    Imprimir
                  </Button>
                  {proposal.id && (
                    <Button size="sm" className="gradient-primary" onClick={() => createContractFromProposal(proposal)}>
                      <FileSignature className="w-3 h-3 mr-1" />
                      Fazer Contrato
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openDeleteModal(proposal, 'proposal')} className="bg-red-500/20 border-red-500/20 text-red-400 hover:bg-red-500/30">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>

                {proposal.timeline && proposal.timeline.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Timeline:</p>
                    <div className="flex gap-2 flex-wrap">
                      {proposal.timeline.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs">
                          {item.stage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {proposals.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum orçamento cadastrado</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* PLANOS */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openModal('plan')} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 rounded-xl"
              >
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-[#ff5000] mb-4">
                  R$ {plan.price?.toLocaleString('pt-BR')}
                  <span className="text-sm text-gray-400">/mês</span>
                </p>
                <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                
                {plan.features && (
                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openModal('plan', plan)} className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openDeleteModal(plan, 'plan')} className="bg-red-500/20 border-red-500/20 text-red-400 hover:bg-red-500/30">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* CONTRATOS */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="grid gap-4">
            {contracts.map(contract => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{contract.client_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>
                        {contract.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">Contrato #{contract.contract_number}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {contract.start_date && format(new Date(contract.start_date), 'dd/MM/yyyy')} até{' '}
                      {contract.end_date && format(new Date(contract.end_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#ff5000]">
                      R$ {contract.monthly_value?.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Vencimento dia {contract.payment_day}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => openModal('contract', contract)} className="bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
                    <FileText className="w-3 h-3 mr-1" />
                    Gerar PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openDeleteModal(contract, 'contract')} className="bg-red-500/20 border-red-500/20 text-red-400 hover:bg-red-500/30">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </motion.div>
            ))}

            {contracts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contrato cadastrado</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para criar/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 max-w-3xl max-h-[90vh] overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Novo'} {modalType === 'proposal' ? 'Orçamento' : modalType === 'plan' ? 'Plano' : 'Contrato'}
            </DialogTitle>
          </DialogHeader>
          
          {modalType === 'proposal' && (
            <ProposalForm proposal={editingItem} onSave={loadData} onClose={() => setModalOpen(false)} />
          )}
          {modalType === 'plan' && (
            <PlanForm plan={editingItem} onSave={loadData} onClose={() => setModalOpen(false)} />
          )}
          {modalType === 'contract' && (
            <ContractForm contract={editingItem} onSave={loadData} onClose={() => setModalOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Orçamento */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Visualizar Orçamento #{viewingProposal?.proposal_number}</span>
              <Button size="sm" variant="outline" onClick={() => handlePrintProposal(viewingProposal)}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {viewingProposal && (
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Cliente</Label>
                  <p className="text-white font-medium">{viewingProposal.client_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">CPF/CNPJ</Label>
                  <p className="text-white font-medium">{viewingProposal.client_cpf_cnpj}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Telefone</Label>
                  <p className="text-white font-medium">{viewingProposal.client_phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">E-mail</Label>
                  <p className="text-white font-medium">{viewingProposal.client_email || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-400 text-sm">Endereço</Label>
                  <p className="text-white font-medium">{viewingProposal.client_address || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Tipo</Label>
                  <p className="text-white font-medium">{viewingProposal.type}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Status</Label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${statusColors[viewingProposal.status]}`}>
                    {viewingProposal.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <Label className="text-white font-medium mb-3 block">Itens do Orçamento</Label>
                <div className="space-y-2">
                  {viewingProposal.items?.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-[#1a1a2e] rounded-lg">
                      <div className="col-span-5 text-white">{item.description}</div>
                      <div className="col-span-2 text-gray-400">Qtd: {item.quantity}</div>
                      <div className="col-span-2 text-gray-400">R$ {item.unit_price?.toFixed(2)}</div>
                      <div className="col-span-3 text-[#ff5000] font-medium text-right">R$ {item.total?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Subtotal</Label>
                  <p className="text-white font-medium text-lg">R$ {viewingProposal.total_value?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Desconto</Label>
                  <p className="text-white font-medium text-lg">R$ {viewingProposal.discount?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Valor Final</Label>
                  <p className="text-[#ff5000] font-bold text-2xl">R$ {viewingProposal.final_value?.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <Label className="text-gray-400 text-sm">Validade</Label>
                <p className="text-white font-medium">
                  {viewingProposal.valid_until ? format(new Date(viewingProposal.valid_until), 'dd/MM/yyyy') : '-'}
                </p>
              </div>

              <div className="border-t border-white/10 pt-4 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handlePrintProposal(viewingProposal)}
                  className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button 
                  onClick={() => createContractFromProposal(viewingProposal)}
                  className="flex-1 gradient-primary"
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  Fazer Contrato
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão com Senha */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 p-6">
            <p className="text-gray-300">
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </p>
            
            <div>
              <Label className="text-gray-400 mb-2 block">Senha do Admin *</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Digite a senha (padrão: 0000)"
                className="bg-[#1a1a2e] border-white/10 text-white"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteModalOpen(false)} 
                className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDelete} 
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}