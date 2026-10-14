import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

export default function ItemForm({ item, onSave, onClose }) {
  const [formData, setFormData] = useState(item || {
    name: '',
    code: '',
    description: '',
    value: 0,
    category: 'servico',
    status: 'ativo'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">{item ? 'Editar' : 'Novo'} Item</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <Label className="text-gray-400 mb-2 block">Nome do Item *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Post para Instagram"
            className="bg-[#1a1a2e] border-white/10"
            required
          />
        </div>

        <div>
          <Label className="text-gray-400 mb-2 block">Código</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder="Ex: POST-INST-001"
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>

        <div>
          <Label className="text-gray-400 mb-2 block">Valor Unitário *</Label>
          <Input
            type="number"
            value={formData.value}
            onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
            placeholder="0.00"
            className="bg-[#1a1a2e] border-white/10"
            required
          />
        </div>

        <div>
          <Label className="text-gray-400 mb-2 block">Descrição</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição do item..."
            className="bg-[#1a1a2e] border-white/10 min-h-20"
          />
        </div>

        <div>
          <Label className="text-gray-400 mb-2 block">Categoria</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
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

        <div>
          <Label className="text-gray-400 mb-2 block">Status</Label>
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
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1 gradient-primary">
          Salvar Item
        </Button>
      </div>
    </>
  );
}