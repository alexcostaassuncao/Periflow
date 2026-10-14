import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from 'framer-motion';

const CARTEIRAS = [
  { id: 'all',          label: 'Todos',          icon: '👥' },
  { id: 'c1',           label: 'C1',             icon: '1️⃣' },
  { id: 'c2',           label: 'C2',             icon: '2️⃣' },
  { id: 'c3',           label: 'C3',             icon: '3️⃣' },
  { id: 'projetos',     label: 'Projetos',       icon: '📋' },
  { id: 'cancelados',   label: 'Cancelados',     icon: '❌' },
  { id: 'nao_definida', label: 'Não Definido',   icon: '❓' },
];

const STATUS_BADGE = {
  ativo:     { label: 'Ativo',     bg: 'bg-green-500/20',  text: 'text-green-400' },
  inativo:   { label: 'Inativo',   bg: 'bg-gray-500/20',   text: 'text-gray-400' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-500/20',    text: 'text-red-400' },
  projeto:   { label: 'Projeto',   bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
};

const MOTIVOS_EXCLUSAO = [
  'Cliente cancelou contrato',
  'Dados duplicados',
  'Cadastro incorreto',
  'Empresa encerrada',
  'Migração para outro sistema',
  'Outro',
];

function DeleteModal({ client, onConfirm, onCancel }) {
  const [motivo, setMotivo] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const motivoFinal = motivo === 'Outro' ? motivoCustom : motivo;
    if (!motivoFinal.trim()) return;
    setLoading(true);
    await onConfirm(client, motivoFinal);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#12121a] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Excluir cliente</h3>
            <p className="text-sm text-gray-400">{client.name}</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">Selecione o motivo da exclusão:</p>

        <div className="space-y-2 mb-4">
          {MOTIVOS_EXCLUSAO.map(m => (
            <button
              key={m}
              onClick={() => setMotivo(m)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                motivo === m
                  ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                  : 'bg-black/20 border border-white/5 text-gray-300 hover:bg-white/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {motivo === 'Outro' && (
          <Input
            placeholder="Descreva o motivo..."
            value={motivoCustom}
            onChange={e => setMotivoCustom(e.target.value)}
            className="mb-4 bg-black/30 border-white/10 text-white"
          />
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!motivo || (motivo === 'Outro' && !motivoCustom.trim()) || loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function ClientCard({ client, onEdit, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const badge = STATUS_BADGE[client.status] || STATUS_BADGE.ativo;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-[#12121a] border border-white/10 hover:border-white/20 transition-all group"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{client.name}</h4>
            {client.fantasy_name && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{client.fantasy_name}</p>
            )}
          </div>
          <span className={`ml-2 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        {client.contact_name && (
          <p className="text-xs text-gray-500 truncate mb-2">👤 {client.contact_name}</p>
        )}

        <div className="space-y-1 text-xs text-gray-500 mb-4">
          {client.email && <p className="truncate">📧 {client.email}</p>}
          {client.phone && <p className="truncate">📱 {client.phone}</p>}
          {client.segment && <p className="truncate">🎯 {client.segment}</p>}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onEdit(client)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-medium"
          >
            Ver
          </Button>
          <Button
            size="sm"
            onClick={() => onEdit(client)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8 font-medium"
          >
            Editar
          </Button>
          <Button
            size="icon"
            onClick={() => setShowDelete(true)}
            className="h-8 w-8 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {showDelete && (
        <DeleteModal
          client={client}
          onConfirm={(c, motivo) => {
            onDelete(c, motivo);
            setShowDelete(false);
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

export default function ClientesCarteira({ clients, onEdit, onAdd, onDelete }) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const grouped = useMemo(() => {
    const result = {
      all: [],
      c1: [],
      c2: [],
      c3: [],
      projetos: [],
      cancelados: [],
      nao_definida: []
    };

    clients.forEach(client => {
      result.all.push(client);
      const carteira = client.carteira || 'nao_definida';
      if (result[carteira]) result[carteira].push(client);
    });

    return result;
  }, [clients]);

  const filtered = useMemo(() => {
    const carteiraData = grouped[activeTab] || [];
    if (!searchQuery) return carteiraData;
    return carteiraData.filter(c =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fantasy_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [grouped, activeTab, searchQuery]);

  const count = useMemo(() => {
    const result = {};
    Object.keys(grouped).forEach(key => {
      result[key] = grouped[key].length;
    });
    return result;
  }, [grouped]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1a2e] border-white/10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#1a1a2e] grid grid-cols-4 lg:grid-cols-7 w-full gap-1 p-1">
          {CARTEIRAS.map(carteira => (
            <TabsTrigger
              key={carteira.id}
              value={carteira.id}
              className="data-[state=active]:bg-[#ff5000] text-xs h-9"
            >
              <span className="mr-1">{carteira.icon}</span>
              <span className="hidden sm:inline">{carteira.label}</span>
              <span className="ml-1 text-[10px] opacity-75">{count[carteira.id]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CARTEIRAS.map(carteira => (
          <TabsContent key={carteira.id} value={carteira.id} className="space-y-4">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <p className="text-sm">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>

                {carteira.id !== 'all' && carteira.id !== 'cancelados' && carteira.id !== 'nao_definida' && (
                  <Button
                    onClick={() => onAdd(carteira.id)}
                    className="w-full gradient-primary text-sm h-9"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Cliente — {carteira.label}
                  </Button>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}