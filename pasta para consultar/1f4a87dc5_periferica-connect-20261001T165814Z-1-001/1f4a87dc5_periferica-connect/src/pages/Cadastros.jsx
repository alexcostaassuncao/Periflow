import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  X,
  History,
  Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import ClientForm from '../components/cadastros/ClientForm';
import ClientesCarteira from '../components/cadastros/ClientesCarteira';
import SupplierForm from '../components/cadastros/SupplierForm';
import ExpenseForm from '../components/cadastros/ExpenseForm';
import EmployeeForm from '../components/cadastros/EmployeeForm';
import ItemForm from '../components/cadastros/ItemForm';
import PlanFormCadastro from '../components/cadastros/PlanFormCadastro';
import UnifiedEmployeeCard from '@/components/cadastros/UnifiedEmployeeCard';
import UserCard from '@/components/cadastros/UserCard';

export default function Cadastros() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('funcionarios');
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [items, setItems] = useState([]);
  const [projectTemplates, setProjectTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [filterCarteira, setFilterCarteira] = useState('all');
  const [defaultCarteiraForNew, setDefaultCarteiraForNew] = useState('nao_definida');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);

      // Verifica se é admin ou gerência
      const access = currentUser.role === 'admin';
      setHasAccess(access);

      if (access) {
        const [clientsData, suppliersData, expensesData, employeesData, usersData, plansData, itemsData, templatesData, logsData, rolesData] = await Promise.all([
          localApp.entities.Client.list(),
          localApp.entities.Supplier.list(),
          localApp.entities.Expense.list(),
          localApp.entities.Employee.list(),
          localApp.entities.User.list(),
          localApp.entities.Plan.list(),
          localApp.entities.Item.list(),
          localApp.entities.ProjectTemplate.list(),
          localApp.entities.SystemLog.list('-created_date', 100),
          localApp.entities.UserRole.list()
        ]);

        setClients(clientsData);
        setSuppliers(suppliersData);
        setExpenses(expensesData);
        setEmployees(employeesData);
        setUsers(usersData);
        setPlans(plansData);
        setItems(itemsData);
        setProjectTemplates(templatesData);
        setLogs(logsData);
        setUserRoles(rolesData);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (action, entityType, entityId, entityName, details = {}) => {
    try {
      await localApp.entities.SystemLog.create({
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        user_email: user.email,
        user_name: user.full_name,
        details
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const handleSave = async (data) => {
    const entityMap = {
      clientes: { entity: 'Client', state: setClients },
      fornecedores: { entity: 'Supplier', state: setSuppliers },
      despesas: { entity: 'Expense', state: setExpenses },
      funcionarios: { entity: 'Employee', state: setEmployees },
      planos: { entity: 'Plan', state: setPlans },
      itens: { entity: 'Item', state: setItems },
      modelos: { entity: 'ProjectTemplate', state: setProjectTemplates }
    };

    const mapping = entityMap[activeTab];
    if (!mapping) return;
    const { entity, state } = mapping;

    if (editingItem) {
      await localApp.entities[entity].update(editingItem.id, data);
      state(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
      await logAction('update', entity, editingItem.id, data.name || data.full_name || data.title, data);
    } else {
      const newItem = await localApp.entities[entity].create(data);
      state(prev => [...prev, newItem]);
      await logAction('create', entity, newItem.id, data.name || data.full_name || data.title, data);
    }

    setShowModal(false);
    setEditingItem(null);
  };

  const handleDeleteClient = async (client, motivo) => {
    await localApp.entities.Client.delete(client.id);
    setClients(prev => prev.filter(c => c.id !== client.id));
    await logAction('delete', 'Client', client.id, client.name, { motivo });
  };

  const handleDelete = async (id, itemName) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    const entityMap = {
      clientes: { entity: 'Client', state: setClients },
      fornecedores: { entity: 'Supplier', state: setSuppliers },
      despesas: { entity: 'Expense', state: setExpenses },
      funcionarios: { entity: 'Employee', state: setEmployees },
      planos: { entity: 'Plan', state: setPlans },
      itens: { entity: 'Item', state: setItems },
      modelos: { entity: 'ProjectTemplate', state: setProjectTemplates }
    };

    const mapping = entityMap[activeTab];
    if (!mapping) return;
    const { entity, state } = mapping;
    await localApp.entities[entity].delete(id);
    state(prev => prev.filter(item => item.id !== id));
    await logAction('delete', entity, id, itemName, {});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <X className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-gray-400">Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  // Para a aba de funcionários, combina employee + user
  const getEnrichedEmployees = () => {
    return employees.map(emp => {
      const linkedUser = users.find(u => u.id === emp.user_id);
      return { emp, linkedUser };
    });
  };

  const getDataByTab = () => {
    switch (activeTab) {
      case 'clientes': return clients;
      case 'fornecedores': return suppliers;
      case 'despesas': return expenses;
      case 'planos': return plans;
      case 'itens': return items;
      case 'modelos': return projectTemplates;
      case 'historico': return logs;
      default: return [];
    }
  };

  // Funcionários filtrados por carteira + busca
  const filteredEmployees = getEnrichedEmployees().filter(({ emp, linkedUser }) => {
    const matchSearch = !searchQuery ||
      linkedUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      linkedUser?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCarteira = filterCarteira === 'all' || emp.carteira === filterCarteira;
    return matchSearch && matchCarteira;
  });

  const filteredData = getDataByTab().filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cadastros</h1>
          <p className="text-gray-400 mt-1">Funcionários, clientes, fornecedores e mais</p>
        </div>
        {activeTab !== 'historico' && activeTab !== 'clientes' && (
          <Button onClick={() => { setEditingItem(null); setShowModal(true); }} className="gradient-primary">
            <Plus className="w-5 h-5 mr-2" />
            {activeTab === 'funcionarios' ? 'Novo Funcionário' : 'Novo Cadastro'}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#1a1a2e] grid grid-cols-9 w-full">
          <TabsTrigger value="funcionarios" className="data-[state=active]:bg-[#ff5000]">
            <Users className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Funcionários</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-[#ff5000]">
            <Shield className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="data-[state=active]:bg-[#ff5000]">
            <Building className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="data-[state=active]:bg-[#ff5000]">
            <Briefcase className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="despesas" className="data-[state=active]:bg-[#ff5000]">
            <DollarSign className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Despesas</span>
          </TabsTrigger>
          <TabsTrigger value="planos" className="data-[state=active]:bg-[#ff5000]">
            <DollarSign className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Planos</span>
          </TabsTrigger>
          <TabsTrigger value="itens" className="data-[state=active]:bg-[#ff5000]">
            <Briefcase className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Itens</span>
          </TabsTrigger>
          <TabsTrigger value="modelos" className="data-[state=active]:bg-[#ff5000]">
            <Briefcase className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Modelos</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:bg-[#ff5000]">
            <History className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* Filtro de carteira para funcionários */}
        {activeTab === 'funcionarios' && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-gray-500 font-semibold">Filtrar por carteira:</span>
            {['all','c1','c2','c3','c4','gerencia','videomaker','comercial'].map(c => (
              <button
                key={c}
                onClick={() => setFilterCarteira(c)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  filterCarteira === c
                    ? 'bg-[#ff5000] text-white'
                    : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
                }`}
              >
                {c === 'all' ? '👥 Todos' : c.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {activeTab !== 'clientes' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a2e] border-white/10"
            />
          </div>
        )}

        {/* ── ABA USUÁRIOS ── */}
        {activeTab === 'usuarios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u =>
              !searchQuery ||
              u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.email?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((u, index) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <UserCard
                  user={u}
                  userRole={userRoles.find(r => r.user_email === u.email)}
                  adminUser={user}
                  onView={() => {}}
                  onPermissions={(u) => { setSelectedUserForPermissions(u); setShowPermissionsModal(true); }}
                  onDelete={handleDelete}
                  onLog={logAction}
                />
              </motion.div>
            ))}
            {users.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">Nenhum usuário encontrado</div>
            )}
          </div>
        )}

        {/* ── ABA CLIENTES — por carteira ── */}
        {activeTab === 'clientes' && (
          <ClientesCarteira
            clients={clients}
            onEdit={(c) => { setEditingItem(c); setShowModal(true); }}
            onAdd={(carteira) => { setEditingItem(null); setDefaultCarteiraForNew(carteira); setShowModal(true); }}
            onDelete={handleDeleteClient}
          />
        )}

        <div className={`glass-card rounded-2xl overflow-hidden ${activeTab === 'clientes' || activeTab === 'usuarios' ? 'hidden' : ''}`}>
          {activeTab === 'historico' ? (
            <div className="p-6 space-y-3">
              {filteredData.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 rounded-xl bg-[#1a1a2e] border border-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      log.action === 'create' ? 'bg-green-500/20' :
                      log.action === 'update' ? 'bg-blue-500/20' : 'bg-red-500/20'
                    }`}>
                      {log.action === 'create' && <Plus className="w-5 h-5 text-green-400" />}
                      {log.action === 'update' && <Edit className="w-5 h-5 text-blue-400" />}
                      {log.action === 'delete' && <Trash2 className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          log.action === 'create' ? 'bg-green-500/20 text-green-400' :
                          log.action === 'update' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.action === 'create' ? 'Criado' : log.action === 'update' ? 'Atualizado' : 'Excluído'}
                        </span>
                        <span className="text-xs text-gray-400">{log.entity_type}</span>
                      </div>
                      <p className="font-medium mb-1">{log.entity_name || 'Sem nome'}</p>
                      <p className="text-xs text-gray-500">{log.user_name} · {new Date(log.created_date).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredData.length === 0 && <div className="text-center py-12 text-gray-500">Nenhum registro de histórico encontrado</div>}
            </div>

          ) : activeTab === 'funcionarios' ? (
            /* ── ABA UNIFICADA FUNCIONÁRIOS/USUÁRIOS ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredEmployees.map(({ emp, linkedUser }, index) => (
                <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <UnifiedEmployeeCard
                    employee={emp}
                    linkedUser={linkedUser}
                    userRole={userRoles.find(r => r.user_email === linkedUser?.email)}
                    onView={(e) => { setViewingItem(e); setShowViewModal(true); }}
                    onEdit={(e) => { setEditingItem(e); setShowModal(true); }}
                    onDelete={handleDelete}
                    onPermissions={(u) => { setSelectedUserForPermissions(u); setShowPermissionsModal(true); }}
                  />
                </motion.div>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  {filterCarteira !== 'all' ? `Nenhum funcionário na carteira ${filterCarteira.toUpperCase()}` : 'Nenhum funcionário cadastrado'}
                </div>
              )}
            </div>

          ) : (
            /* ── OUTRAS ABAS ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredData.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-[#1a1a2e] hover:bg-[#1a1a2e]/80 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#ff5000]/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#ff5000]" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name || item.full_name}</h4>
                        {(item.status || item.employee_status) && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            (item.status === 'ativo' || item.employee_status === 'ativo') ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {item.status || item.employee_status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setViewingItem(item); setShowViewModal(true); }} className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs">Ver</button>
                      <button onClick={() => { setEditingItem(item); setShowModal(true); }} className="px-2.5 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs">Editar</button>
                      <button onClick={() => handleDelete(item.id, item.name || item.full_name)} className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs">Excluir</button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    {item.email && <p className="text-gray-400">📧 {item.email}</p>}
                    {item.phone && <p className="text-gray-400">📱 {item.phone}</p>}
                    {item.value != null && <p className="text-[#ff5000] font-medium">R$ {Number(item.value).toFixed(2)}</p>}
                    {item.price != null && <p className="text-[#ff5000] font-medium">R$ {Number(item.price).toFixed(2)}</p>}
                    {item.category && <p className="text-gray-400">📂 {item.category}</p>}
                    {item.code && <p className="text-gray-400">🔖 {item.code}</p>}
                  </div>
                </motion.div>
              ))}
              {filteredData.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">Nenhum registro encontrado</div>
              )}
            </div>
          )}
        </div>
      </Tabs>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#12121a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[#ff5000]/20"
              onClick={(e) => e.stopPropagation()}
            >
              {activeTab === 'clientes' && (
                <ClientForm
                  client={editingItem}
                  onSave={handleSave}
                  onClose={() => { setShowModal(false); setEditingItem(null); }}
                  defaultCarteira={defaultCarteiraForNew}
                />
              )}
              {activeTab === 'fornecedores' && (
                <SupplierForm 
                  supplier={editingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowModal(false)} 
                />
              )}
              {activeTab === 'despesas' && (
                <ExpenseForm 
                  expense={editingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowModal(false)}
                  clients={clients}
                  suppliers={suppliers}
                />
              )}
              {activeTab === 'funcionarios' && (
                <EmployeeForm
                  employee={editingItem}
                  users={users}
                  onSave={handleSave}
                  onClose={() => { setShowModal(false); setEditingItem(null); }}
                />
              )}
              {activeTab === 'planos' && (
                <PlanFormCadastro 
                  plan={editingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowModal(false)} 
                />
              )}
              {activeTab === 'itens' && (
                <ItemForm 
                  item={editingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowModal(false)} 
                />
              )}
              {activeTab === 'modelos' && (
                <ProjectTemplateForm 
                  template={editingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowModal(false)} 
                />
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#12121a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[#ff5000]/20"
              onClick={(e) => e.stopPropagation()}
            >
              {activeTab === 'funcionarios' && (
                <EmployeeForm
                  employee={viewingItem}
                  users={users}
                  onSave={handleSave}
                  onClose={() => setShowViewModal(false)}
                  viewOnly={true}
                />
              )}
              {activeTab === 'clientes' && (
                <ClientForm 
                  client={viewingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowViewModal(false)}
                  viewOnly={true}
                />
              )}
              {activeTab === 'fornecedores' && (
                <SupplierForm 
                  supplier={viewingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowViewModal(false)}
                  viewOnly={true}
                />
              )}
              {activeTab === 'despesas' && (
                <ExpenseForm 
                  expense={viewingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowViewModal(false)}
                  clients={clients}
                  suppliers={suppliers}
                  viewOnly={true}
                />
              )}
              {activeTab === 'planos' && (
                <PlanFormCadastro 
                  plan={viewingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowViewModal(false)}
                  viewOnly={true}
                />
              )}
              {activeTab === 'itens' && (
                <ItemForm 
                  item={viewingItem} 
                  onSave={handleSave} 
                  onClose={() => setShowViewModal(false)}
                  viewOnly={true}
                />
              )}
              {activeTab === 'modelos' && (
                <ProjectTemplateFormView 
                  template={viewingItem} 
                  onClose={() => setShowViewModal(false)} 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Permissões */}
      <AnimatePresence>
        {showPermissionsModal && selectedUserForPermissions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPermissionsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#12121a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[#ff5000]/20"
              onClick={(e) => e.stopPropagation()}
            >
              <PermissionsManager 
                user={selectedUserForPermissions}
                userRoles={userRoles}
                onSave={async (roleData) => {
                  const existingRole = userRoles.find(r => r.user_email === selectedUserForPermissions.email);
                  if (existingRole) {
                    await localApp.entities.UserRole.update(existingRole.id, roleData);
                    setUserRoles(prev => prev.map(r => r.id === existingRole.id ? { ...r, ...roleData } : r));
                  } else {
                    const newRole = await localApp.entities.UserRole.create({
                      user_email: selectedUserForPermissions.email,
                      ...roleData
                    });
                    setUserRoles(prev => [...prev, newRole]);
                  }
                  setShowPermissionsModal(false);
                }}
                onClose={() => setShowPermissionsModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}

function PermissionsManager({ user, userRoles, onSave, onClose }) {
  const existingRole = userRoles.find(r => r.user_email === user.email);
  
  const defaultPermissions = {
    cadastros_visualizar: false,
    cadastros_criar_clientes: false,
    cadastros_editar_clientes: false,
    cadastros_excluir_clientes: false,
    cadastros_criar_fornecedores: false,
    cadastros_editar_fornecedores: false,
    cadastros_excluir_fornecedores: false,
    cadastros_criar_funcionarios: false,
    cadastros_editar_funcionarios: false,
    cadastros_excluir_funcionarios: false,
    cadastros_criar_modelos: false,
    cadastros_editar_modelos: false,
    cadastros_excluir_modelos: false,
    
    tarefas_criar: false,
    tarefas_editar: false,
    tarefas_excluir: false,
    tarefas_criar_por_modelo: false,
    tarefas_visualizar_todas: false,
    tarefas_visualizar_minhas: true,
    tarefas_alterar_responsaveis: false,
    tarefas_avancar_etapas: false,
    tarefas_voltar_etapas: false,
    tarefas_concluir: false,
    
    eventos_visualizar: true,
    eventos_avancar: false,
    eventos_retornar: false,
    eventos_alterar_ordem: false,
    eventos_finalizar: false,
    eventos_reabrir: false,
    
    formularios_visualizar: true,
    formularios_preencher: false,
    formularios_editar: false,
    formularios_anexar_arquivos: false,
    formularios_excluir_anexos: false,
    
    ajustes_solicitar: true,
    ajustes_visualizar: true,
    ajustes_responder: false,
    ajustes_aprovar: false,
    ajustes_recusar: false,
    
    publicacao_enviar_aprovacao: false,
    publicacao_aprovar: false,
    publicacao_solicitar_ajuste: false,
    publicacao_programar: false,
    publicacao_alterar_data: false,
    publicacao_excluir: false,
    publicacao_ajustar_pos: false,
    
    monitoramento_visualizar: true,
    monitoramento_acompanhar: false,
    monitoramento_alterar_plataforma: false,
    monitoramento_finalizar: false,
    
    chat_enviar_mensagens: true,
    chat_ler_mensagens: true,
    chat_criar_grupos: false,
    chat_adicionar_membros: false,
    chat_remover_membros: false,
    chat_excluir_grupo: false,
    
    ponto_bater: true,
    ponto_registrar_foto: true,
    ponto_visualizar_proprio: true,
    ponto_solicitar_ajuste: true,
    ponto_visualizar_solicitacoes: false,
    ponto_ajustar_terceiros: false,
    ponto_aprovar_ajuste: false,
    
    comercial_criar_orcamento: false,
    comercial_editar_orcamento: false,
    comercial_excluir_orcamento: false,
    comercial_criar_planos: false,
    comercial_editar_planos: false,
    comercial_criar_contrato: false,
    comercial_editar_contrato: false,
    comercial_imprimir_orcamento: false,
    comercial_imprimir_contrato: false,
    comercial_converter_contrato: false,

    central_dados_visualizar: false,
    central_dados_importar: false,

    calendario_visualizar: true,
    calendario_criar_eventos: false,
    calendario_editar_eventos: false,
    calendario_excluir_eventos: false,

    relatorios_visualizar: false,

    recompensas_visualizar: true,

    crm_visualizar: false,
    crm_criar_leads: false,
    crm_editar_leads: false,
  };

  const [selectedModule, setSelectedModule] = useState('cadastros');

  const papeis = [
    { value: 'admin', label: 'Admin' },
    { value: 'coo', label: 'COO' },
    { value: 'gerente_admin', label: 'Gerente Admin' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'gestor_carteira', label: 'Gestor de Carteira' },
    { value: 'consultor', label: 'Consultor' },
    { value: 'designer', label: 'Designer' },
    { value: 'video_maker', label: 'Video Maker' },
    { value: 'copy', label: 'Copy' },
    { value: 'gestor_trafego', label: 'Gestor de Tráfego' }
  ];

  const permissionModules = {
    cadastros: {
      label: '📦 Cadastros',
      permissions: [
        { key: 'cadastros_visualizar', label: 'Visualizar cadastros' },
        { key: 'cadastros_criar_clientes', label: 'Criar clientes' },
        { key: 'cadastros_editar_clientes', label: 'Editar clientes' },
        { key: 'cadastros_excluir_clientes', label: 'Excluir clientes' },
        { key: 'cadastros_criar_fornecedores', label: 'Criar fornecedores' },
        { key: 'cadastros_editar_fornecedores', label: 'Editar fornecedores' },
        { key: 'cadastros_excluir_fornecedores', label: 'Excluir fornecedores' },
        { key: 'cadastros_criar_funcionarios', label: 'Criar funcionários' },
        { key: 'cadastros_editar_funcionarios', label: 'Editar funcionários' },
        { key: 'cadastros_excluir_funcionarios', label: 'Excluir funcionários' },
        { key: 'cadastros_criar_modelos', label: 'Criar modelos de projeto' },
        { key: 'cadastros_editar_modelos', label: 'Editar modelos de projeto' },
        { key: 'cadastros_excluir_modelos', label: 'Excluir modelos de projeto' }
      ]
    },
    tarefas: {
      label: '✅ Tarefas & Projetos',
      permissions: [
        { key: 'tarefas_criar', label: 'Criar tarefas' },
        { key: 'tarefas_editar', label: 'Editar tarefas' },
        { key: 'tarefas_excluir', label: 'Excluir tarefas' },
        { key: 'tarefas_criar_por_modelo', label: 'Criar tarefas por modelo' },
        { key: 'tarefas_visualizar_todas', label: 'Visualizar todas as tarefas' },
        { key: 'tarefas_visualizar_minhas', label: 'Visualizar apenas minhas tarefas' },
        { key: 'tarefas_alterar_responsaveis', label: 'Alterar responsáveis' },
        { key: 'tarefas_avancar_etapas', label: 'Avançar etapas' },
        { key: 'tarefas_voltar_etapas', label: 'Voltar etapas' },
        { key: 'tarefas_concluir', label: 'Concluir tarefas' }
      ]
    },
    eventos: {
      label: '🔄 Eventos (Workflow)',
      permissions: [
        { key: 'eventos_visualizar', label: 'Visualizar eventos' },
        { key: 'eventos_avancar', label: 'Avançar evento' },
        { key: 'eventos_retornar', label: 'Retornar evento' },
        { key: 'eventos_alterar_ordem', label: 'Alterar ordem dos eventos' },
        { key: 'eventos_finalizar', label: 'Finalizar evento' },
        { key: 'eventos_reabrir', label: 'Reabrir evento' }
      ]
    },
    formularios: {
      label: '📋 Formulários',
      permissions: [
        { key: 'formularios_visualizar', label: 'Visualizar formulários' },
        { key: 'formularios_preencher', label: 'Preencher formulários' },
        { key: 'formularios_editar', label: 'Editar formulários' },
        { key: 'formularios_anexar_arquivos', label: 'Anexar arquivos' },
        { key: 'formularios_excluir_anexos', label: 'Excluir anexos' }
      ]
    },
    ajustes: {
      label: '🔧 Ajustes',
      permissions: [
        { key: 'ajustes_solicitar', label: 'Solicitar ajuste' },
        { key: 'ajustes_visualizar', label: 'Visualizar ajustes' },
        { key: 'ajustes_responder', label: 'Responder ajustes' },
        { key: 'ajustes_aprovar', label: 'Aprovar ajuste' },
        { key: 'ajustes_recusar', label: 'Recusar ajuste' }
      ]
    },
    publicacao: {
      label: '📱 Aprovação & Publicação',
      permissions: [
        { key: 'publicacao_enviar_aprovacao', label: 'Enviar para aprovação' },
        { key: 'publicacao_aprovar', label: 'Aprovar sem ajuste' },
        { key: 'publicacao_solicitar_ajuste', label: 'Solicitar ajuste ao cliente' },
        { key: 'publicacao_programar', label: 'Programar publicação' },
        { key: 'publicacao_alterar_data', label: 'Alterar data/horário de publicação' },
        { key: 'publicacao_excluir', label: 'Excluir publicação' },
        { key: 'publicacao_ajustar_pos', label: 'Ajustar publicação pós-post' }
      ]
    },
    monitoramento: {
      label: '📊 Monitoramento',
      permissions: [
        { key: 'monitoramento_visualizar', label: 'Visualizar monitoramento' },
        { key: 'monitoramento_acompanhar', label: 'Acompanhar post em tempo real' },
        { key: 'monitoramento_alterar_plataforma', label: 'Alterar plataforma visualizada' },
        { key: 'monitoramento_finalizar', label: 'Finalizar monitoramento' }
      ]
    },
    chat: {
      label: '💬 Chat',
      permissions: [
        { key: 'chat_enviar_mensagens', label: 'Enviar mensagens' },
        { key: 'chat_ler_mensagens', label: 'Ler mensagens' },
        { key: 'chat_criar_grupos', label: 'Criar grupos' },
        { key: 'chat_adicionar_membros', label: 'Adicionar membros ao grupo' },
        { key: 'chat_remover_membros', label: 'Remover membros' },
        { key: 'chat_excluir_grupo', label: 'Excluir grupo' }
      ]
    },
    ponto: {
      label: '⏰ Ponto',
      permissions: [
        { key: 'ponto_bater', label: 'Bater ponto' },
        { key: 'ponto_registrar_foto', label: 'Registrar foto no ponto' },
        { key: 'ponto_visualizar_proprio', label: 'Visualizar próprio histórico' },
        { key: 'ponto_solicitar_ajuste', label: 'Solicitar ajuste de ponto' },
        { key: 'ponto_visualizar_solicitacoes', label: 'Visualizar solicitações' },
        { key: 'ponto_ajustar_terceiros', label: 'Ajustar ponto de terceiros' },
        { key: 'ponto_aprovar_ajuste', label: 'Aprovar/recusar ajuste de ponto' }
      ]
    },
    comercial: {
      label: '💼 Comercial',
      permissions: [
        { key: 'comercial_criar_orcamento', label: 'Criar orçamento' },
        { key: 'comercial_editar_orcamento', label: 'Editar orçamento' },
        { key: 'comercial_excluir_orcamento', label: 'Excluir orçamento' },
        { key: 'comercial_criar_planos', label: 'Criar planos comerciais' },
        { key: 'comercial_editar_planos', label: 'Editar planos comerciais' },
        { key: 'comercial_criar_contrato', label: 'Criar contrato' },
        { key: 'comercial_editar_contrato', label: 'Editar contrato' },
        { key: 'comercial_imprimir_orcamento', label: 'Imprimir orçamento' },
        { key: 'comercial_imprimir_contrato', label: 'Imprimir contrato' },
        { key: 'comercial_converter_contrato', label: 'Converter orçamento em contrato' }
      ]
    },
    central_dados: {
      label: '🗄️ Central de Dados',
      permissions: [
        { key: 'central_dados_visualizar', label: 'Visualizar Central de Dados (dashboard de produtividade)' },
        { key: 'central_dados_importar', label: 'Importar CSVs (apenas admins por padrão)' }
      ]
    },
    calendario: {
      label: '📅 Calendário',
      permissions: [
        { key: 'calendario_visualizar', label: 'Visualizar calendário' },
        { key: 'calendario_criar_eventos', label: 'Criar eventos' },
        { key: 'calendario_editar_eventos', label: 'Editar eventos' },
        { key: 'calendario_excluir_eventos', label: 'Excluir eventos' }
      ]
    },
    relatorios: {
      label: '📈 Relatórios',
      permissions: [
        { key: 'relatorios_visualizar', label: 'Visualizar relatórios' }
      ]
    },
    crm: {
      label: '📊 CRM',
      permissions: [
        { key: 'crm_visualizar', label: 'Visualizar CRM' },
        { key: 'crm_criar_leads', label: 'Criar leads' },
        { key: 'crm_editar_leads', label: 'Editar leads' }
      ]
    },
    recompensas: {
      label: '🏆 Recompensas',
      permissions: [
        { key: 'recompensas_visualizar', label: 'Visualizar recompensas' }
      ]
    }
  };

  const [formData, setFormData] = useState({
    papel: existingRole?.papel || 'consultor',
    permissions: { ...defaultPermissions, ...existingRole?.permissions },
    status: existingRole?.status || 'ativo'
  });

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const toggleAllInModule = (moduleKey) => {
    const module = permissionModules[moduleKey];
    const allChecked = module.permissions.every(p => formData.permissions[p.key]);
    
    const updates = {};
    module.permissions.forEach(p => {
      updates[p.key] = !allChecked;
    });
    
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        ...updates
      }
    }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onSave(formData);
  };

  const currentModule = permissionModules[selectedModule];

  const toggleAllPermissions = (enable) => {
    const allPermissions = {};
    Object.keys(permissionModules).forEach(moduleKey => {
      permissionModules[moduleKey].permissions.forEach(p => {
        allPermissions[p.key] = enable;
      });
    });
    setFormData(prev => ({
      ...prev,
      permissions: allPermissions
    }));
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold">Conceder Acessos</h2>
          <p className="text-sm text-gray-400 mt-1">{user.full_name} ({user.email})</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex h-[70vh]">
        {/* Sidebar com módulos */}
        <div className="w-64 border-r border-white/10 p-4 space-y-1 overflow-y-auto">
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Papel/Função</label>
            <select
              value={formData.papel}
              onChange={(e) => setFormData(prev => ({ ...prev, papel: e.target.value }))}
              className="w-full h-9 bg-[#1a1a2e] border border-white/10 rounded-md px-2 text-sm text-white"
            >
              {papeis.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full h-9 bg-[#1a1a2e] border border-white/10 rounded-md px-2 text-sm text-white"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="convidado">Convidado</option>
            </select>
          </div>

          <div className="mb-4 space-y-2">
            <button
              type="button"
              onClick={() => toggleAllPermissions(true)}
              className="w-full px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium transition-all"
            >
              ✓ Liberar Todos os Acessos
            </button>
            <button
              type="button"
              onClick={() => toggleAllPermissions(false)}
              className="w-full px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-all"
            >
              ✗ Remover Todos os Acessos
            </button>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-xs text-gray-500 mb-2">MÓDULOS</p>
            {Object.keys(permissionModules).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedModule(key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-1 ${
                  selectedModule === key 
                    ? 'bg-[#ff5000] text-white' 
                    : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                {permissionModules[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Área de permissões */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{currentModule.label}</h3>
            <button
              type="button"
              onClick={() => toggleAllInModule(selectedModule)}
              className="text-xs text-[#ff5000] hover:text-[#cc4000]"
            >
              {currentModule.permissions.every(p => formData.permissions[p.key]) 
                ? 'Desmarcar todas' 
                : 'Marcar todas'}
            </button>
          </div>

          <div className="space-y-2">
            {currentModule.permissions.map(perm => (
              <div 
                key={perm.key}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a2e] hover:bg-[#1a1a2e]/80 transition-all cursor-pointer"
                onClick={() => togglePermission(perm.key)}
              >
                <span className="text-sm">{perm.label}</span>
                <div className={`w-12 h-6 rounded-full transition-all ${
                  formData.permissions[perm.key] ? 'bg-[#ff5000]' : 'bg-gray-700'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-all transform mt-0.5 ${
                    formData.permissions[perm.key] ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button variant="outline" onClick={onClose} className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} className="flex-1 gradient-primary">
          Salvar Acessos
        </Button>
      </div>
    </>
  );
}

function ProjectTemplateFormView({ template, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">Visualizar Modelo de Projeto</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Nome do Modelo</label>
          <Input
            value={template.name}
            disabled
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Descrição</label>
          <Input
            value={template.description || ''}
            disabled
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Recorrência</label>
          <Input
            value={template.recurrence || 'mensal'}
            disabled
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>

        <div className="border-t border-white/10 pt-4">
          <label className="text-gray-400 text-sm block mb-3">Tarefas do Modelo</label>
          <div className="space-y-3">
            {template.tasks?.map((task, index) => (
              <div key={index} className="p-3 bg-[#1a1a2e] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tarefa {index + 1}</span>
                </div>
                
                <Input
                  value={task.name}
                  disabled
                  className="bg-[#12121a] border-white/10"
                />

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={task.task_type}
                    disabled
                    className="bg-[#12121a] border-white/10"
                  />
                  <Input
                    value={task.quantity}
                    disabled
                    className="bg-[#12121a] border-white/10"
                  />
                  <Input
                    value={task.priority}
                    disabled
                    className="bg-[#12121a] border-white/10"
                  />
                </div>
              </div>
            ))}

            {(!template.tasks || template.tasks.length === 0) && (
              <p className="text-center text-gray-500 py-4">Nenhuma tarefa</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button onClick={onClose} className="flex-1 gradient-primary">
          Fechar
        </Button>
      </div>
    </>
  );
}

function ProjectTemplateForm({ template, onSave, onClose }) {
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
                  placeholder="Nome da tarefa"
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