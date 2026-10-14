import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { motion } from 'framer-motion';
import { Package, Plus, Upload, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EstoqueStats from '@/components/estoque/EstoqueStats';
import EstoqueFilters from '@/components/estoque/EstoqueFilters';
import EstoqueTable from '@/components/estoque/EstoqueTable';
import ItemModal from '@/components/estoque/ItemModal';
import ItemHistoricoModal from '@/components/estoque/ItemHistoricoModal';
import EstoqueImportTab from '@/components/estoque/EstoqueImportTab';

const TABS = ['Itens', 'Importar'];

const DEFAULT_FILTERS = {
  busca: '', categoria: 'todos', localizacao: 'todos', status: 'ativo', funcionario: 'todos',
};

export default function Estoque() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Itens');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Modals
  const [modalItem, setModalItem] = useState(null); // null = closed, {} = new, item = edit
  const [viewItem, setViewItem] = useState(null);
  const [histItem, setHistItem] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);
      setIsAdmin(currentUser.role === 'admin');

      const [itemsData, empsData] = await Promise.all([
        localApp.entities.EquipamentoItem.list('-updated_date', 200),
        localApp.entities.Employee.list(),
      ]);

      // Enrich employees with user data
      const users = await localApp.entities.User.list();
      const enriched = empsData.map(emp => {
        const u = users.find(u => u.id === emp.user_id);
        return { ...emp, full_name: u?.full_name || emp.position, user_email: u?.email || '' };
      });

      setItems(itemsData);
      setEmployees(enriched);
    } finally {
      setLoading(false);
    }
  };

  /* ── Filtered items ── */
  const filtered = items.filter(item => {
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      const matchNome = item.nome?.toLowerCase().includes(q);
      const matchCodigo = item.codigo?.toLowerCase().includes(q);
      const matchDescricao = item.descricao?.toLowerCase().includes(q);
      if (!matchNome && !matchCodigo && !matchDescricao) return false;
    }
    if (filters.categoria !== 'todos' && item.categoria !== filters.categoria) return false;
    if (filters.localizacao !== 'todos' && item.localizacao !== filters.localizacao) return false;
    if (filters.status !== 'todos' && item.status !== filters.status) return false;
    if (filters.funcionario !== 'todos' && item.funcionario_responsavel_email !== filters.funcionario && item.funcionario_responsavel_nome !== filters.funcionario) return false;
    return true;
  });

  /* ── Save item (create or update) ── */
  const handleSave = async (form) => {
    const now = new Date().toISOString();
    const { motivo, ...data } = form;

    if (modalItem?.id) {
      // Editing — build history diff
      const old = modalItem;
      const histEntry = {
        tipo_alteracao: 'edicao',
        usuario_email: user.email,
        usuario_nome: user.full_name,
        data_hora: now,
        motivo: motivo || '',
      };
      const changedFields = ['nome','descricao','quantidade','localizacao','status','funcionario_responsavel_nome','observacoes']
        .filter(k => String(old[k] ?? '') !== String(data[k] ?? ''));

      const novoHistorico = [...(old.historico || [])];
      changedFields.forEach(k => {
        novoHistorico.push({ ...histEntry, campo_alterado: k, valor_anterior: String(old[k] ?? ''), novo_valor: String(data[k] ?? '') });
      });
      if (changedFields.length === 0) {
        novoHistorico.push({ ...histEntry, tipo_alteracao: 'observacao' });
      }

      await localApp.entities.EquipamentoItem.update(modalItem.id, { ...data, historico: novoHistorico });
    } else {
      // Creating
      await localApp.entities.EquipamentoItem.create({
        ...data,
        cadastrado_por: user.email,
        cadastrado_por_nome: user.full_name,
        historico: [{ tipo_alteracao: 'criacao', usuario_email: user.email, usuario_nome: user.full_name, data_hora: now }],
      });
    }
    setModalItem(null);
    loadData();
  };

  /* ── Soft delete ── */
  const handleDelete = async (item) => {
    if (!window.confirm(`Deseja marcar "${item.nome}" como excluído? O item não será apagado do banco.`)) return;
    const now = new Date().toISOString();
    const novoHistorico = [...(item.historico || []), {
      tipo_alteracao: 'exclusao',
      usuario_email: user.email,
      usuario_nome: user.full_name,
      data_hora: now,
      valor_anterior: item.status,
      novo_valor: 'excluido',
    }];
    await localApp.entities.EquipamentoItem.update(item.id, { status: 'excluido', historico: novoHistorico });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Package className="w-7 h-7 text-[#ff5000]" />
            Estoque e Equipamentos
          </h1>
          <p className="text-gray-400 mt-1">Controle de itens, localização e histórico de alterações</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => { setActiveTab('Importar'); }}
              variant="ghost"
              className="text-gray-400 hover:text-white border border-white/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button onClick={() => setModalItem({})} className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <EstoqueStats items={items} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#1a1a2e] w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'gradient-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'Itens' ? <span className="flex items-center gap-2"><List className="w-4 h-4" />Itens ({filtered.length})</span> : tab}
          </button>
        ))}
      </div>

      {/* Tab: Itens */}
      {activeTab === 'Itens' && (
        <div className="space-y-4">
          <EstoqueFilters filters={filters} onChange={setFilters} employees={employees} />

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Lista de Itens</h2>
              <Button variant="ghost" size="sm" onClick={loadData} className="text-gray-400 hover:text-white">
                <RefreshCw className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
            </div>
            <EstoqueTable
              items={filtered}
              canEdit={isAdmin}
              onView={setViewItem}
              onEdit={(item) => setModalItem(item)}
              onHistory={setHistItem}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {/* Tab: Importar */}
      {activeTab === 'Importar' && (
        isAdmin ? (
          <EstoqueImportTab user={user} onImportDone={() => { loadData(); setActiveTab('Itens'); }} />
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Apenas administradores podem importar dados.</p>
          </div>
        )
      )}

      {/* Modal: Item (Create/Edit) */}
      {modalItem !== null && (
        <ItemModal
          item={modalItem?.id ? modalItem : null}
          employees={employees}
          onSave={handleSave}
          onClose={() => setModalItem(null)}
        />
      )}

      {/* Modal: View (read-only usando histório modal reaproveitado) */}
      {viewItem && (
        <ItemHistoricoModal item={viewItem} onClose={() => setViewItem(null)} />
      )}

      {/* Modal: Histórico */}
      {histItem && (
        <ItemHistoricoModal item={histItem} onClose={() => setHistItem(null)} />
      )}
    </div>
  );
}