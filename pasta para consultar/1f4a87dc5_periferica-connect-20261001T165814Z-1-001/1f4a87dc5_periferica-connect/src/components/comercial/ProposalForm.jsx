import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ProposalForm({ proposal, onSave, onClose }) {
  const [plans, setPlans] = useState([]);
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', code: '', description: '', value: 0, category: 'servico' });
  const [newClient, setNewClient] = useState({ name: '', type: 'pj', status: 'ativo' });
  const [user, setUser] = useState(null);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientNameSearchOpen, setClientNameSearchOpen] = useState(false);
  const [formData, setFormData] = useState(proposal || {
    proposal_number: `ORC-${Date.now()}`,
    client_name: '',
    client_cpf_cnpj: '',
    client_address: '',
    client_phone: '',
    client_email: '',
    type: 'social_media',
    plan_id: '',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    total_value: 0,
    discount: 0,
    final_value: 0,
    status: 'rascunho',
    salesperson_email: '',
    sdr_email: '',
    timeline: [],
    valid_until: ''
  });

  useEffect(() => {
    loadPlans();
    loadItems();
    loadUser();
    loadClients();
  }, []);

  const loadPlans = async () => {
    const plansData = await localApp.entities.Plan.filter({ status: 'ativo' });
    setPlans(plansData);
  };

  const loadItems = async () => {
    const itemsData = await localApp.entities.Item.filter({ status: 'ativo' });
    setItems(itemsData);
  };

  const loadUser = async () => {
    const currentUser = await localApp.auth.me();
    setUser(currentUser);
  };

  const loadClients = async () => {
    const clientsData = await localApp.entities.Client.list();
    setClients(clientsData);
  };

  const handleCreateItem = async () => {
    const created = await localApp.entities.Item.create(newItem);
    setItems(prev => [...prev, created]);
    setShowItemModal(false);
    setNewItem({ name: '', code: '', description: '', value: 0, category: 'servico' });
  };

  const handleSearchClient = async (cpfCnpj) => {
    if (!cpfCnpj) return;
    const found = clients.find(c => c.cpf_cnpj === cpfCnpj);
    if (found) {
      setFormData(prev => ({
        ...prev,
        client_name: found.name,
        client_address: found.contact_name || '',
        client_phone: found.phone || '',
        client_email: found.email || ''
      }));
      setClientNotFound(false);
    } else {
      setClientNotFound(true);
    }
  };

  const handleSelectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client_name: client.name,
      client_cpf_cnpj: client.cpf_cnpj || '',
      client_address: client.contact_name || '',
      client_phone: client.phone || '',
      client_email: client.email || ''
    }));
    setClientSearchOpen(false);
    setClientNameSearchOpen(false);
    setClientNotFound(false);
  };

  const handleSelectItem = (item, idx) => {
    updateItem(idx, 'description', item.name);
    updateItem(idx, 'unit_price', item.value);
  };

  const handleCreateClient = async () => {
    const created = await localApp.entities.Client.create(newClient);
    setClients(prev => [...prev, created]);
    setFormData(prev => ({
      ...prev,
      client_name: created.name,
      client_cpf_cnpj: created.client_cpf_cnpj,
      client_address: created.contact_name || '',
      client_phone: created.phone || '',
      client_email: created.email || ''
    }));
    setShowClientModal(false);
    setClientNotFound(false);
    setNewClient({ name: '', type: 'pj', status: 'ativo' });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    calculateTotal();
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      items[index].total = items[index].quantity * items[index].unit_price;
    }
    setFormData(prev => ({ ...prev, items }));
    calculateTotal();
  };

  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const final = total - (formData.discount || 0);
    setFormData(prev => ({ ...prev, total_value: total, final_value: final }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (proposal) {
      await localApp.entities.Proposal.update(proposal.id, formData);
    } else {
      await localApp.entities.Proposal.create(formData);
    }
    onSave();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 mb-2 block">Nome do Cliente *</Label>
          <Popover open={clientNameSearchOpen} onOpenChange={setClientNameSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-[#1a1a2e] border-white/10 text-white hover:bg-[#1a1a2e]/80"
              >
                {formData.client_name || "Selecione ou digite o cliente..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-[#1a1a2e] border-white/10">
              <Command className="bg-[#1a1a2e]">
                <CommandInput 
                  placeholder="Buscar cliente..." 
                  className="text-white"
                  value={formData.client_name}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_name: value }))}
                />
                <CommandList>
                  <CommandEmpty className="text-white p-4">Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup>
                    {clients
                      .filter(c => c.name?.toLowerCase().includes(formData.client_name?.toLowerCase() || ''))
                      .map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.name}
                          onSelect={() => handleSelectClient(client)}
                          className="text-white cursor-pointer hover:bg-white/10"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.client_name === client.name ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-gray-400">{client.cpf_cnpj}</div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-gray-400 mb-2 block">CPF/CNPJ *</Label>
          <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-[#1a1a2e] border-white/10 text-white hover:bg-[#1a1a2e]/80"
              >
                {formData.client_cpf_cnpj || "Selecione ou digite CPF/CNPJ..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-[#1a1a2e] border-white/10">
              <Command className="bg-[#1a1a2e]">
                <CommandInput 
                  placeholder="Buscar CPF/CNPJ..." 
                  className="text-white"
                  value={formData.client_cpf_cnpj}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, client_cpf_cnpj: value }));
                    if (value.length >= 11) {
                      handleSearchClient(value);
                    }
                  }}
                />
                <CommandList>
                  <CommandEmpty className="text-white p-4">
                    {formData.client_cpf_cnpj && formData.client_cpf_cnpj.length >= 11 ? (
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={() => { setShowClientModal(true); setClientSearchOpen(false); }} 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Cliente não cadastrado - Cadastrar agora
                      </Button>
                    ) : (
                      "Digite pelo menos 11 dígitos..."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {clients
                      .filter(c => c.cpf_cnpj?.includes(formData.client_cpf_cnpj || ''))
                      .map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.cpf_cnpj}
                          onSelect={() => handleSelectClient(client)}
                          className="text-white cursor-pointer hover:bg-white/10"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.client_cpf_cnpj === client.cpf_cnpj ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div>
                            <div className="font-medium">{client.cpf_cnpj}</div>
                            <div className="text-xs text-gray-400">{client.name}</div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 mb-2 block">Telefone</Label>
          <Input
            value={formData.client_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-400 mb-2 block">E-mail</Label>
          <Input
            type="email"
            value={formData.client_email}
            onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10 text-white"
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-400 mb-2 block">Endereço</Label>
        <Input
          value={formData.client_address}
          onChange={(e) => setFormData(prev => ({ ...prev, client_address: e.target.value }))}
          className="bg-[#1a1a2e] border-white/10 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-400 mb-2 block">Tipo *</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="material_avulso">Material Avulso</SelectItem>
              <SelectItem value="campanha">Campanha</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="completo">Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-400 mb-2 block">Plano</Label>
          <Select value={formData.plan_id || 'none'} onValueChange={(v) => setFormData(prev => ({ ...prev, plan_id: v === 'none' ? '' : v }))}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="none">Nenhum</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-white">Itens do Orçamento</Label>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => setShowItemModal(true)} variant="outline" className="border-white/10">
              <Plus className="w-4 h-4 mr-1" />
              Cadastrar Novo Item
            </Button>
            <Button type="button" size="sm" onClick={addItem} variant="outline" className="border-white/10">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar da Lista
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {formData.items.length === 0 && (
            <div className="text-center py-8 bg-[#1a1a2e] rounded-lg">
              <p className="text-gray-400 mb-3">Nenhum item adicionado</p>
              <Button type="button" onClick={() => setShowItemModal(true)} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Item
              </Button>
            </div>
          )}
          {formData.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-[#1a1a2e] border-white/10 text-white hover:bg-[#1a1a2e]/80 h-9 px-3"
                    >
                      <span className="truncate">{item.description || "Selecione ou digite..."}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 bg-[#1a1a2e] border-white/10">
                    <Command className="bg-[#1a1a2e]">
                      <CommandInput 
                        placeholder="Buscar item..." 
                        className="text-white"
                        value={item.description}
                        onValueChange={(value) => updateItem(idx, 'description', value)}
                      />
                      <CommandList>
                        <CommandEmpty className="text-white p-4">Nenhum item encontrado.</CommandEmpty>
                        <CommandGroup>
                          {items
                            .filter(i => i.name?.toLowerCase().includes(item.description?.toLowerCase() || ''))
                            .map((availableItem) => (
                              <CommandItem
                                key={availableItem.id}
                                value={availableItem.name}
                                onSelect={() => handleSelectItem(availableItem, idx)}
                                className="text-white cursor-pointer hover:bg-white/10"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    item.description === availableItem.name ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{availableItem.name}</div>
                                  <div className="text-xs text-gray-400">
                                    R$ {availableItem.value?.toFixed(2)} • {availableItem.category}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Valor"
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value))}
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div className="col-span-2">
                <Input
                  value={`R$ ${item.total.toFixed(2)}`}
                  disabled
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div className="col-span-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)} className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-gray-400 mb-2 block">Subtotal</Label>
          <Input
            value={`R$ ${formData.total_value.toFixed(2)}`}
            disabled
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>
        <div>
          <Label className="text-gray-400 mb-2 block">Desconto</Label>
          <Input
            type="number"
            value={formData.discount}
            onChange={(e) => {
              const discount = parseFloat(e.target.value) || 0;
              setFormData(prev => ({ ...prev, discount, final_value: prev.total_value - discount }));
            }}
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>
        <div>
          <Label className="text-gray-400 mb-2 block">Valor Final</Label>
          <Input
            value={`R$ ${formData.final_value.toFixed(2)}`}
            disabled
            className="bg-[#1a1a2e] border-white/10 font-bold text-[#ff5000]"
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-400 mb-2 block">Validade</Label>
        <Input
          type="date"
          value={formData.valid_until}
          onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
          className="bg-[#1a1a2e] border-white/10"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 gradient-primary">
          {proposal ? 'Atualizar' : 'Criar'} Orçamento
        </Button>
      </div>

      {/* Modal Cadastrar Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] rounded-2xl w-full max-w-md p-6 border border-[#ff5000]/20">
            <h3 className="text-xl font-bold mb-4">Cadastrar Novo Item</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Nome *</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Código</Label>
                <Input
                  value={newItem.code}
                  onChange={(e) => setNewItem(prev => ({ ...prev, code: e.target.value }))}
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Valor Unitário *</Label>
                <Input
                  type="number"
                  value={newItem.value}
                  onChange={(e) => setNewItem(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Descrição</Label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Categoria</Label>
                <Select value={newItem.category} onValueChange={(v) => setNewItem(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="stories">Stories</SelectItem>
                    <SelectItem value="reels">Reels</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowItemModal(false)} className="flex-1 border-white/10">
                  Cancelar
                </Button>
                <Button type="button" onClick={handleCreateItem} className="flex-1 gradient-primary">
                  Cadastrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] rounded-2xl w-full max-w-md p-6 border border-[#ff5000]/20">
            <h3 className="text-xl font-bold mb-4">Cadastro Rápido de Cliente</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Nome *</Label>
                <Input
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">CPF/CNPJ</Label>
                <Input
                  value={formData.client_cpf_cnpj}
                  disabled
                  className="bg-[#1a1a2e] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Tipo</Label>
                <Select value={newClient.type} onValueChange={(v) => setNewClient(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowClientModal(false)} className="flex-1 border-white/10">
                  Cancelar
                </Button>
                <Button type="button" onClick={handleCreateClient} className="flex-1 gradient-primary">
                  Cadastrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}