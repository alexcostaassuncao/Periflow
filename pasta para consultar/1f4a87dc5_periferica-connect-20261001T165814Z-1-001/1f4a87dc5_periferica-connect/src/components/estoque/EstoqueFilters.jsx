import React from 'react';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const CATEGORIAS = [
  { value: 'informatica', label: 'Informática' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'eletronico', label: 'Eletrônico' },
  { value: 'audio_video', label: 'Áudio/Vídeo' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'ferramenta', label: 'Ferramenta' },
  { value: 'papelaria', label: 'Papelaria' },
  { value: 'outros', label: 'Outros' },
];

export default function EstoqueFilters({ filters, onChange, employees }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-[#ff5000]" />
        <span className="text-sm font-medium">Filtros</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Input
          placeholder="Buscar nome, código ou série..."
          value={filters.busca}
          onChange={e => set('busca', e.target.value)}
          className="bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 col-span-2 md:col-span-1"
        />
        <Select value={filters.categoria} onValueChange={v => set('categoria', v)}>
          <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas categorias</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.localizacao} onValueChange={v => set('localizacao', v)}>
          <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue placeholder="Localização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas localizações</SelectItem>
            <SelectItem value="estoque">Em Estoque</SelectItem>
            <SelectItem value="com_funcionario">Com Funcionário</SelectItem>
            <SelectItem value="manutencao">Em Manutenção</SelectItem>
            <SelectItem value="descartado">Descartado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={v => set('status', v)}>
          <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="excluido">Excluído</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.funcionario} onValueChange={v => set('funcionario', v)}>
          <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue placeholder="Funcionário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {employees.filter(e => e.user_email).map((e, idx) => (
              <SelectItem key={`${e.user_email}-${idx}`} value={e.user_email}>{e.full_name || e.position}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}