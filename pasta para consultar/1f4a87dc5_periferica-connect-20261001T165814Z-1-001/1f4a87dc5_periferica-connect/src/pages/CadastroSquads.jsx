import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Save, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

const TIPOS = [
  { value: 'planejamento_recorrente', label: 'Planejamento Recorrente' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'cancelamento', label: 'Cancelamento' },
  { value: 'outro', label: 'Outro' },
];

const TIPO_LABEL = {
  planejamento_recorrente: 'Recorrente',
  campanha: 'Campanha',
  cancelamento: 'Cancelamento',
  outro: 'Outro',
};

export default function CadastroSquads() {
  const [vinculos, setVinculos] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filterSquad, setFilterSquad] = useState('todos');

  // Formulário de novo vínculo
  const [novoWorkspace, setNovoWorkspace] = useState('');
  const [novoSquad, setNovoSquad] = useState('');
  const [novoTipo, setNovoTipo] = useState('planejamento_recorrente');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [vs, ws] = await Promise.all([
      localApp.entities.ClienteSquad.list(),
      localApp.entities.EkyteWorkspace.list('-updated_date', 2000),
    ]);
    setVinculos(vs);
    // Workspaces únicos
    const unique = [...new Map(ws.map(w => [w.workspace, w])).values()];
    setWorkspaces(unique);
    setLoading(false);
  };

  const squadsUnicos = [...new Set(vinculos.map(v => v.squad_nome).filter(Boolean))].sort();

  const handleAdd = async () => {
    const nome = novoWorkspace.trim().toUpperCase();
    const squad = novoSquad.trim();
    if (!nome || !squad) return;
    setSaving(true);
    // Verifica se já existe
    const existe = vinculos.find(v => v.workspace_nome === nome);
    if (existe) {
      await localApp.entities.ClienteSquad.update(existe.id, { squad_nome: squad, tipo_cliente: novoTipo });
    } else {
      await localApp.entities.ClienteSquad.create({ workspace_nome: nome, squad_nome: squad, tipo_cliente: novoTipo, status: 'ativo' });
    }
    setNovoWorkspace('');
    setSaving(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover vínculo deste cliente com o squad?')) return;
    await localApp.entities.ClienteSquad.delete(id);
    loadData();
  };

  const handleUpdate = async (id, field, value) => {
    await localApp.entities.ClienteSquad.update(id, { [field]: value });
    loadData();
  };

  // Workspaces ainda sem squad
  const vinculadosNomes = new Set(vinculos.map(v => v.workspace_nome));
  const semSquad = workspaces.filter(w => !vinculadosNomes.has(w.workspace));

  const filtered = vinculos.filter(v => {
    if (filterSquad !== 'todos' && v.squad_nome !== filterSquad) return false;
    if (busca && !v.workspace_nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-4">
        <Link to="/Importacoes">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-6 h-6 text-[#ff5000]" />
            Cadastro de Squads / Carteiras
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Vincule cada cliente (Workspace) ao seu squad correspondente</p>
        </div>
      </div>

      {/* Adicionar vínculo */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#ff5000]" />
          Vincular Cliente ao Squad
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Workspace / Cliente (como aparece no CSV)</label>
            <Input
              value={novoWorkspace}
              onChange={e => setNovoWorkspace(e.target.value)}
              placeholder="Ex: ELOWAY"
              list="ws-list"
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
            <datalist id="ws-list">
              {semSquad.map(w => <option key={w.workspace} value={w.workspace} />)}
            </datalist>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Squad / Carteira</label>
            <Input
              value={novoSquad}
              onChange={e => setNovoSquad(e.target.value)}
              placeholder="Ex: Carteira C1"
              list="squad-list"
              className="bg-[#1a1a2e] border-white/10 text-white"
            />
            <datalist id="squad-list">
              {squadsUnicos.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
            <Select value={novoTipo} onValueChange={setNovoTipo}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={saving || !novoWorkspace.trim() || !novoSquad.trim()} className="mt-4 gradient-primary text-white">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Vínculo'}
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="bg-[#1a1a2e] border-white/10 text-white pl-9"
          />
        </div>
        <Select value={filterSquad} onValueChange={setFilterSquad}>
          <SelectTrigger className="w-48 bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os squads</SelectItem>
            {squadsUnicos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de vínculos */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold mb-4">
          Vínculos Configurados <span className="text-gray-500 font-normal text-sm">({filtered.length})</span>
        </h2>
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum vínculo configurado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/5 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{v.workspace_nome}</p>
                </div>
                <Select value={v.squad_nome} onValueChange={val => handleUpdate(v.id, 'squad_nome', val)}>
                  <SelectTrigger className="w-40 bg-[#12121a] border-white/10 text-white text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {squadsUnicos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    <SelectItem value={v.squad_nome}>{v.squad_nome}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={v.tipo_cliente || 'planejamento_recorrente'} onValueChange={val => handleUpdate(v.id, 'tipo_cliente', val)}>
                  <SelectTrigger className="w-32 bg-[#12121a] border-white/10 text-white text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} className="h-8 w-8 text-gray-500 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Clientes sem squad */}
      {semSquad.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-yellow-500/20">
          <h2 className="font-bold mb-4 text-yellow-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {semSquad.length} workspaces sem squad vinculado
          </h2>
          <div className="flex flex-wrap gap-2">
            {semSquad.map(w => (
              <button
                key={w.workspace}
                onClick={() => setNovoWorkspace(w.workspace)}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs hover:bg-yellow-500/20 transition-colors"
              >
                {w.workspace}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">Clique em um workspace para pré-preencher o formulário acima</p>
        </div>
      )}
    </div>
  );
}