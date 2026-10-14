import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SquadForm({ squad, users, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: squad?.name || '',
    code: squad?.code || '',
    manager_email: squad?.manager_email || '',
    members: squad?.members || [],
    clients: squad?.clients || [],
    status: squad?.status || 'ativo'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleMember = (email) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(email)
        ? prev.members.filter(e => e !== email)
        : [...prev.members, email]
    }));
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">{squad ? 'Editar' : 'Novo'} Squad</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Nome do Squad *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: C1 - Carteira Christina"
            className="bg-[#1a1a2e] border-white/10"
            required
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Código *</label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder="Ex: C1, C2, C3"
            className="bg-[#1a1a2e] border-white/10"
            required
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Gestor Responsável *</label>
          <select
            value={formData.manager_email}
            onChange={(e) => setFormData(prev => ({ ...prev, manager_email: e.target.value }))}
            className="w-full h-10 bg-[#1a1a2e] border border-white/10 rounded-md px-3 text-white"
            required
          >
            <option value="">Selecione um gestor...</option>
            {users.map(user => (
              <option key={user.id} value={user.email}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full h-10 bg-[#1a1a2e] border border-white/10 rounded-md px-3 text-white"
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Membros do Squad</label>
          <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-[#1a1a2e] rounded-lg">
            {users.map(user => (
              <div
                key={user.id}
                onClick={() => toggleMember(user.email)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <span className="text-sm">{user.full_name}</span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  formData.members.includes(user.email)
                    ? 'bg-[#ff5000] border-[#ff5000]'
                    : 'border-gray-600'
                }`}>
                  {formData.members.includes(user.email) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button variant="outline" onClick={onClose} className="flex-1 border-white/10">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1 gradient-primary">
          {squad ? 'Atualizar' : 'Criar'} Squad
        </Button>
      </div>
    </>
  );
}