import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from 'lucide-react';

export default function ProjectTemplateForm({ template, onSave, onClose }) {
  const [formData, setFormData] = useState(template || {
    name: '',
    description: '',
    recurrence: 'mensal',
    status: 'ativo',
    tasks: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), {
        name: '',
        task_type: 'criacao',
        quantity: 1,
        priority: 'media',
        xp_reward: 50
      }]
    }));
  };

  const removeTask = (index) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const updateTask = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">{template ? 'Editar' : 'Novo'} Modelo de Projeto</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Nome do Modelo *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: JDA - Conteúdo Mensal"
            className="bg-[#1a1a2e] border-white/10"
            required
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Descrição</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Recorrência</label>
          <select
            value={formData.recurrence}
            onChange={(e) => setFormData(prev => ({ ...prev, recurrence: e.target.value }))}
            className="w-full h-9 bg-[#1a1a2e] border border-white/10 rounded-md px-3 text-white"
          >
            <option value="mensal">Mensal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="pontual">Pontual</option>
          </select>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-gray-400 text-sm">Tarefas do Modelo</label>
            <Button type="button" size="sm" onClick={addTask} className="gradient-primary">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Tarefa
            </Button>
          </div>

          <div className="space-y-3">
            {formData.tasks?.map((task, index) => (
              <div key={index} className="p-3 bg-[#1a1a2e] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tarefa {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <Input
                  placeholder="Nome da tarefa (ex: Post Orgânico - Feed)"
                  value={task.name}
                  onChange={(e) => updateTask(index, 'name', e.target.value)}
                  className="bg-[#12121a] border-white/10"
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <select
                      value={task.task_type}
                      onChange={(e) => updateTask(index, 'task_type', e.target.value)}
                      className="w-full h-9 bg-[#12121a] border border-white/10 rounded-md px-2 text-sm text-white"
                    >
                      <option value="criacao">Criação</option>
                      <option value="revisao">Revisão</option>
                      <option value="aprovacao">Aprovação</option>
                    </select>
                  </div>
                  
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qtd"
                    value={task.quantity}
                    onChange={(e) => updateTask(index, 'quantity', parseInt(e.target.value))}
                    className="bg-[#12121a] border-white/10"
                  />

                  <select
                    value={task.priority}
                    onChange={(e) => updateTask(index, 'priority', e.target.value)}
                    className="w-full h-9 bg-[#12121a] border border-white/10 rounded-md px-2 text-sm text-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
            ))}

            {(!formData.tasks || formData.tasks.length === 0) && (
              <p className="text-center text-gray-500 py-4">Nenhuma tarefa adicionada</p>
            )}
          </div>
        </div>
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button variant="outline" onClick={onClose} className="flex-1 border-white/10">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1 gradient-primary">
          Salvar Modelo
        </Button>
      </div>
    </>
  );
}