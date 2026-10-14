import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, LayoutDashboard, TrendingUp, Activity, GitBranch, Users, Package, Building2, BarChart3, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import RelatorioVisaoGeral from '@/components/relatorios/RelatorioVisaoGeral';
import RelatorioVendasCRM from '@/components/relatorios/RelatorioVendasCRM';
import RelatorioProdutividade from '@/components/relatorios/RelatorioProdutividade';
import RelatorioFluxoTrabalho from '@/components/relatorios/RelatorioFluxoTrabalho';
import RelatorioEstoque from '@/components/relatorios/RelatorioEstoque';
import RelatorioFuncionarios from '@/components/relatorios/RelatorioFuncionarios';
import RelatorioClientes from '@/components/relatorios/RelatorioClientes';

function getMesesDisponiveis() {
  const meses = [];
  for (let year = 2025; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      const d = new Date(year, month, 1);
      meses.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM/yyyy', { locale: ptBR }) });
    }
  }
  return meses;
}

const TABS = [
  { value: 'visao_geral', label: 'Visão Geral', icon: LayoutDashboard },
  { value: 'vendas_crm', label: 'Vendas / CRM', icon: TrendingUp },
  { value: 'produtividade', label: 'Produtividade', icon: Activity },
  { value: 'fluxo', label: 'Fluxo de Trabalho', icon: GitBranch },
  { value: 'funcionarios', label: 'Funcionários', icon: Users },
  { value: 'clientes', label: 'Clientes', icon: Building2 },
  { value: 'estoque', label: 'Estoque', icon: Package },
];

export default function Relatorios() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), 'yyyy-MM'));

  // Data
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [ekyteWorkspaces, setEkyteWorkspaces] = useState([]);
  const [clienteSquads, setClienteSquads] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const currentUser = await localApp.auth.me();
    setUser(currentUser);
    const isAdmin = currentUser.role === 'admin';

    const [
      leadsData, tasksData, employeesData, usersData,
      clientsData, itemsData, ekyteData, squadData
    ] = await Promise.allSettled([
      localApp.entities.CRMLead.list('-created_date'),
      isAdmin ? localApp.entities.Task.list('-created_date') : localApp.entities.Task.filter({ responsible_email: currentUser.email }),
      localApp.entities.Employee.list(),
      isAdmin ? localApp.entities.User.list() : Promise.resolve([]),
      localApp.entities.Client.list(),
      localApp.entities.EquipamentoItem.list(),
      localApp.entities.EkyteWorkspace.list(),
      localApp.entities.ClienteSquad.list(),
    ]);

    const safe = (r, fallback = []) => r.status === 'fulfilled' ? r.value : fallback;

    const allLeads = safe(leadsData);
    setLeads(isAdmin ? allLeads : allLeads.filter(l => l.responsavel_email === currentUser.email));
    setTasks(safe(tasksData));
    setEmployees(safe(employeesData));
    setUsers(safe(usersData));
    setClients(safe(clientsData));
    setItems(safe(itemsData));
    setEkyteWorkspaces(safe(ekyteData));
    setClienteSquads(safe(squadData));
    setLoading(false);
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#ff5000]" />
            Central de Relatórios
          </h1>
          <p className="text-gray-400 mt-1">Visão completa do sistema — dados em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-[#ff5000]" />
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-40 border-0 bg-transparent text-white h-auto p-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMesesDisponiveis().map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadData} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="visao_geral" className="space-y-5">
        <TabsList className="bg-[#1a1a2e] border border-white/10 flex-wrap h-auto gap-1 p-1.5">
          {TABS.map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-[#ff5000] data-[state=active]:text-white px-3 py-1.5"
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visao_geral">
          <RelatorioVisaoGeral
            leads={leads}
            tasks={tasks}
            employees={employees}
            clients={clients}
            items={items}
          />
        </TabsContent>

        <TabsContent value="vendas_crm">
          <RelatorioVendasCRM leads={leads} />
        </TabsContent>

        <TabsContent value="produtividade">
          <RelatorioProdutividade
            ekyteWorkspaces={ekyteWorkspaces}
            mesSelecionado={mesSelecionado}
          />
        </TabsContent>

        <TabsContent value="fluxo">
          <RelatorioFluxoTrabalho tasks={tasks} mesSelecionado={mesSelecionado} />
        </TabsContent>

        <TabsContent value="funcionarios">
          <RelatorioFuncionarios employees={employees} users={users} />
        </TabsContent>

        <TabsContent value="clientes">
          <RelatorioClientes clients={clients} clienteSquads={clienteSquads} />
        </TabsContent>

        <TabsContent value="estoque">
          <RelatorioEstoque items={items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}