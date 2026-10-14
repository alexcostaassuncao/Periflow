import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { value: 'todos', label: 'Todas as categorias' },
  { value: 'informatica', label: 'Informática' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'audio_video', label: 'Áudio/Vídeo' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'estudio', label: 'Estúdio' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'outros', label: 'Outros' },
];

const STATUSES = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'em_estoque', label: 'Em Estoque' },
  { value: 'com_funcionario', label: 'Com Funcionário' },
  { value: 'em_manutencao', label: 'Em Manutenção' },
  { value: 'descartado', label: 'Descartado' },
];

export default function StockFilters({ filters, onFiltersChange, employees }) {
  const set = (key, val) => onFiltersChange(prev => ({ ...prev, [key]: val }));

  const activeEmployees = employees.filter(e => e.employee_status === 'ativo' || !e.employee_status);

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-[#ff5000]" />
        <span className="text-sm font-medium">Filtros</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, código..."
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ff5000]/50"
          />
        </div>

        {/* Categoria */}
        <Select value={filters.category} onValueChange={v => set('category', v)}>
          <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={filters.status} onValueChange={v => set('status', v)}>
          <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Funcionário */}
        <Select value={filters.responsible} onValueChange={v => set('responsible', v)}>
          <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue placeholder="Funcionário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os funcionários</SelectItem>
            {activeEmployees.map(e => (
              <SelectItem key={e.user_id} value={e.user_id}>{e.position || e.user_id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mostrar inativos */}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="checkbox"
          id="showDeleted"
          checked={filters.showDeleted}
          onChange={e => set('showDeleted', e.target.checked)}
          className="w-4 h-4 accent-[#ff5000] rounded"
        />
        <label htmlFor="showDeleted" className="text-sm text-gray-400 cursor-pointer">
          Mostrar itens inativos/excluídos
        </label>
      </div>
    </div>
  );
}