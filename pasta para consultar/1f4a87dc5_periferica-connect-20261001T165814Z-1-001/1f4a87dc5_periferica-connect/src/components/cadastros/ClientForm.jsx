import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const CARTEIRAS = [
  { value: 'c1',          label: 'Carteira C1' },
  { value: 'c2',          label: 'Carteira C2' },
  { value: 'c3',          label: 'Carteira C3' },
  { value: 'c4',          label: 'Carteira C4' },
  { value: 'projetos',    label: 'Projetos' },
  { value: 'cancelados',  label: 'Cancelados' },
  { value: 'nao_definida',label: 'Não Definida' },
];

const AREAS = [
  { value: 'gestao', label: 'Gestão' },
  { value: 'campanhas', label: 'Campanhas' },
  { value: 'projetos', label: 'Projetos' },
];

export default function ClientForm({ client, onSave, onClose, viewOnly = false, defaultCarteira = 'nao_definida' }) {
  const [formData, setFormData] = useState({
    name: '',
    fantasy_name: '',
    cpf_cnpj: '',
    type: 'pj',
    status: 'ativo',
    area: 'gestao',
    carteira: defaultCarteira,
    contact_name: '',
    email: '',
    phone: '',
    segment: '',
    services: '',
    contract_type: 'mensal',
    notes: '',
    links: [],
    aliases: [],
    is_also_supplier: false,
    importacao_origem: 'manual',
  });

  const [newLink, setNewLink] = useState('');
  const [newAlias, setNewAlias] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({ ...client, area: client.area || 'gestao', links: client.links || [], aliases: client.aliases || [] });
    } else {
      setFormData(prev => ({ ...prev, area: 'gestao', carteira: defaultCarteira }));
    }
  }, [client, defaultCarteira]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addLink = () => {
    if (newLink.trim()) {
      setFormData(prev => ({ ...prev, links: [...prev.links, newLink.trim()] }));
      setNewLink('');
    }
  };

  const removeLink = (index) => {
    setFormData(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  const addAlias = () => {
    const v = newAlias.trim().toUpperCase();
    if (v && !formData.aliases.includes(v)) {
      setFormData(prev => ({ ...prev, aliases: [...prev.aliases, v] }));
      setNewAlias('');
    }
  };

  const removeAlias = (index) => {
    setFormData(prev => ({ ...prev, aliases: prev.aliases.filter((_, i) => i !== index) }));
  };

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">{viewOnly ? 'Visualizar Cliente' : client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">

        {/* Nome principal + carteira */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-400">Nome Principal *</Label>
            <Input value={formData.name} onChange={e => set('name', e.target.value)}
              className="bg-[#1a1a2e] border-white/10" required disabled={viewOnly} />
          </div>
          <div>
            <Label className="text-gray-400">Área</Label>
            <Select value={formData.area} onValueChange={v => set('area', v)} disabled={viewOnly}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map(area => <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Carteira / Squad</Label>
            <Select value={formData.carteira} onValueChange={v => set('carteira', v)} disabled={viewOnly}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARTEIRAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Aliases */}
        <div>
          <Label className="text-gray-400 mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Aliases / Sinônimos de Importação
          </Label>
          <p className="text-xs text-gray-600 mb-2">Como o nome aparece nos arquivos CSV do eKyte. O sistema usa para vincular automaticamente.</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.aliases.map((a, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#ff5000]/15 text-[#ff5000] font-mono">
                {a}
                {!viewOnly && (
                  <button type="button" onClick={() => removeAlias(i)} className="hover:text-red-400 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            {formData.aliases.length === 0 && <span className="text-xs text-gray-600">Nenhum alias cadastrado</span>}
          </div>
          {!viewOnly && (
            <div className="flex gap-2">
              <Input value={newAlias} onChange={e => setNewAlias(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                placeholder="Ex: STUDIO DANDA SAVIO" className="bg-[#1a1a2e] border-white/10 text-sm font-mono uppercase" />
              <Button type="button" onClick={addAlias} size="sm" className="gradient-primary">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Status + tipo */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-400">Status</Label>
            <Select value={formData.status} onValueChange={v => set('status', v)} disabled={viewOnly}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="projeto">Projeto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Tipo</Label>
            <Select value={formData.type} onValueChange={v => set('type', v)} disabled={viewOnly}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Tipo de Contrato</Label>
            <Select value={formData.contract_type} onValueChange={v => set('contract_type', v)} disabled={viewOnly}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="projeto">Projeto</SelectItem>
                <SelectItem value="avulso">Avulso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nome fantasia + CPF/CNPJ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Nome Fantasia</Label>
            <Input value={formData.fantasy_name} onChange={e => set('fantasy_name', e.target.value)}
              className="bg-[#1a1a2e] border-white/10" disabled={viewOnly} />
          </div>
          <div>
            <Label className="text-gray-400">CPF/CNPJ</Label>
            <Input value={formData.cpf_cnpj} onChange={e => set('cpf_cnpj', e.target.value)}
              className="bg-[#1a1a2e] border-white/10" disabled={viewOnly} />
          </div>
        </div>

        {/* Contato */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-400">Nome do Contato</Label>
            <Input value={formData.contact_name} onChange={e => set('contact_name', e.target.value)}
              className="bg-[#1a1a2e] border-white/10" disabled={viewOnly} />
          </div>
          <div>
            <Label className="text-gray-400">E-mail</Label>
            <Input type="email" value={formData.email} onChange={e => set('email', e.target.value)}
              className="bg-[#1a1a2e] border-white/10" disabled={viewOnly} />
          </div>
          <div>
            <Label className="text-gray-400">Telefone</Label>
            <Input value={formData.phone} onChange={e => set('phone', e.target.value)}
              className="bg-[#1a1a2e] border-white/10" disabled={viewOnly} />
          </div>
        </div>

        {/* Segmento + serviços */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Segmento</Label>
            <Input value={formData.segment} onChange={e => set('segment', e.target.value)}
              placeholder="Ex: Tecnologia, Varejo..." className="bg-[#1a1a2e] border-white/10" disabled={viewOnly} />
          </div>
          <div>
            <Label className="text-gray-400">Serviços Contratados</Label>
            <Input value={formData.services} onChange={e => set('services', e.target.value)}
              placeholder="Ex: Social Media, Tráfego..." className="bg-[#1a1a2e] border-white/10" disabled={viewOnly} />
          </div>
        </div>

        {/* Observações */}
        <div>
          <Label className="text-gray-400">Observações</Label>
          <Textarea value={formData.notes} onChange={e => set('notes', e.target.value)}
            className="bg-[#1a1a2e] border-white/10" disabled={viewOnly} />
        </div>

        {/* Links */}
        <div>
          <Label className="text-gray-400 mb-2 block">Links Externos</Label>
          <div className="space-y-2">
            {formData.links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={link} readOnly className="bg-[#1a1a2e] border-white/10 text-sm" />
                {!viewOnly && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                )}
              </div>
            ))}
            {!viewOnly && (
              <div className="flex gap-2">
                <Input value={newLink} onChange={e => setNewLink(e.target.value)}
                  placeholder="https://..." className="bg-[#1a1a2e] border-white/10" />
                <Button type="button" onClick={addLink} className="gradient-primary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox checked={formData.is_also_supplier}
            onCheckedChange={checked => set('is_also_supplier', checked)} disabled={viewOnly} />
          <Label className="text-gray-400">Este cliente também é fornecedor</Label>
        </div>
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        {viewOnly ? (
          <Button onClick={onClose} className="flex-1 gradient-primary">Fechar</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} className="flex-1 border-white/10">Cancelar</Button>
            <Button onClick={handleSubmit} className="flex-1 gradient-primary">Salvar</Button>
          </>
        )}
      </div>
    </>
  );
}