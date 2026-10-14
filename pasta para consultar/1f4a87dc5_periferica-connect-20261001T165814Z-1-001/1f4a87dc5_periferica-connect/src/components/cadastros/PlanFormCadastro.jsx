import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, X } from 'lucide-react';

export default function PlanFormCadastro({ plan, onSave, onClose }) {
  const [formData, setFormData] = useState(plan || {
    name: '',
    description: '',
    price: 0,
    category: 'social_media',
    features: [''],
    deliverables: { posts: 0, stories: 0, reels: 0, design_pieces: 0 },
    status: 'ativo'
  });

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const updateFeature = (index, value) => {
    const features = [...formData.features];
    features[index] = value;
    setFormData(prev => ({ ...prev, features }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">{plan ? 'Editar' : 'Novo'} Plano</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <Label className="text-gray-400 mb-2 block">Nome do Plano *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Business Suite"
            className="bg-[#1a1a2e] border-white/10"
            required
          />
        </div>

        <div>
          <Label className="text-gray-400 mb-2 block">Descrição</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição do plano..."
            className="bg-[#1a1a2e] border-white/10 min-h-20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400 mb-2 block">Preço Mensal *</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              placeholder="0.00"
              className="bg-[#1a1a2e] border-white/10"
              required
            />
          </div>
          <div>
            <Label className="text-gray-400 mb-2 block">Categoria *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="trafego">Tráfego</SelectItem>
                <SelectItem value="completo">Completo</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-400">Recursos Incluídos</Label>
            <Button type="button" size="sm" onClick={addFeature} variant="outline" className="border-white/10">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {formData.features.map((feature, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(idx, e.target.value)}
                  placeholder="Ex: 8 posts mensais"
                  className="bg-[#1a1a2e] border-white/10"
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeFeature(idx)} className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-gray-400 mb-3 block">Entregas Mensais</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500 mb-1 block">Posts</Label>
              <Input
                type="number"
                value={formData.deliverables.posts}
                onChange={(e) => setFormData(prev => ({ ...prev, deliverables: { ...prev.deliverables, posts: parseInt(e.target.value) } }))}
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500 mb-1 block">Stories</Label>
              <Input
                type="number"
                value={formData.deliverables.stories}
                onChange={(e) => setFormData(prev => ({ ...prev, deliverables: { ...prev.deliverables, stories: parseInt(e.target.value) } }))}
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500 mb-1 block">Reels</Label>
              <Input
                type="number"
                value={formData.deliverables.reels}
                onChange={(e) => setFormData(prev => ({ ...prev, deliverables: { ...prev.deliverables, reels: parseInt(e.target.value) } }))}
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500 mb-1 block">Peças de Design</Label>
              <Input
                type="number"
                value={formData.deliverables.design_pieces}
                onChange={(e) => setFormData(prev => ({ ...prev, deliverables: { ...prev.deliverables, design_pieces: parseInt(e.target.value) } }))}
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>
          </div>
        </div>
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1 gradient-primary">
          Salvar Plano
        </Button>
      </div>
    </>
  );
}