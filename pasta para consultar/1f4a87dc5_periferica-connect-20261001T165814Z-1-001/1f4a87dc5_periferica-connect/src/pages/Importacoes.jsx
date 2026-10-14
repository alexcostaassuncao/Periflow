import React, { useState, useEffect, useRef } from 'react';
import { localApp } from '@/api/localClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Upload, BarChart2, Clock, Filter, RefreshCw,
  AlertTriangle, CheckCircle2, TrendingUp, FilePlus2,
  FileText, X, Info, Settings, Database,
  Users, Package, Briefcase, ShoppingCart,
  UserCheck, FileSignature, Layers, GitMerge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseEkyteCsv } from '@/lib/ekyteCsvParser';
import SquadDashboard from '@/components/importacoes/SquadDashboard';
import ImportHistoryTable from '@/components/importacoes/ImportHistoryTable';
import { Link } from 'react-router-dom';

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

// Módulos da central — cada um tem sua aba
const MODULOS = [
  { id: 'produtividade', label: 'Produtividade', icon: TrendingUp, color: '#ff5000', adminOnly: false },
  { id: 'fluxo',        label: 'Fluxo de Trabalho', icon: GitMerge, color: '#3b82f6', adminOnly: true },
  { id: 'tarefas',      label: 'Tarefas', icon: CheckCircle2, color: '#22c55e', adminOnly: true },
  { id: 'crm',          label: 'CRM / Comercial', icon: TrendingUp, color: '#a855f7', adminOnly: true },
  { id: 'estoque',      label: 'Estoque', icon: Package, color: '#f59e0b', adminOnly: true },
  { id: 'clientes',     label: 'Clientes', icon: Briefcase, color: '#06b6d4', adminOnly: true },
  { id: 'fornecedores', label: 'Fornecedores', icon: ShoppingCart, color: '#84cc16', adminOnly: true },
  { id: 'funcionarios', label: 'Funcionários / Usuários', icon: Users, color: '#ec4899', adminOnly: true },
  { id: 'contratos',    label: 'Contratos', icon: FileSignature, color: '#f97316', adminOnly: true },
  { id: 'onboarding',   label: 'Onboarding', icon: UserCheck, color: '#10b981', adminOnly: true },
  { id: 'historico',    label: 'Histórico', icon: Clock, color: '#6b7280', adminOnly: false },
];

// Componente genérico "Em breve"
function EmBreve({ modulo }) {
  return (
    <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${modulo.color}20` }}>
        <modulo.icon className="w-8 h-8" style={{ color: modulo.color }} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Importação de {modulo.label}</h3>
        <p className="text-gray-400 max-w-md">
          Esta aba estará disponível em breve. Aqui será possível importar dados de <strong>{modulo.label}</strong> via CSV, Excel ou PDF para alimentar o sistema automaticamente.
        </p>
      </div>
      <div className="px-4 py-2 rounded-full text-xs font-semibold" style={{ background: `${modulo.color}20`, color: modulo.color }}>
        Em desenvolvimento
      </div>
    </div>
  );
}

export default function Importacoes() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [imports, setImports] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [clienteSquads, setClienteSquads] = useState([]);
  const [activeModulo, setActiveModulo] = useState('produtividade');
  const [loading, setLoading] = useState(true);
  const [filterMes, setFilterMes] = useState(format(new Date(), 'yyyy-MM'));
  const [competencia, setCompetencia] = useState(format(new Date(), 'yyyy-MM'));
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadLog, setUploadLog] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sub-tab do módulo Produtividade
  const [prodTab, setProdTab] = useState('Dashboard');

  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);
      const [importData, wsData, csData, employeesData] = await Promise.all([
        localApp.entities.ImportRecord.list('-created_date', 50),
        localApp.entities.EkyteWorkspace.list('-updated_date', 2000),
        localApp.entities.ClienteSquad.list(),
        localApp.entities.Employee.list(),
      ]);
      setImports(importData);
      setWorkspaces(wsData);
      setClienteSquads(csData);
      const emp = employeesData.find(e => e.user_id === currentUser.id);
      setEmployee(emp || null);
    } finally {
      setLoading(false);
    }
  };

  const [userPermissions, setUserPermissions] = useState(null);

  useEffect(() => {
    const loadPerms = async () => {
      try {
        const u = await localApp.auth.me();
        const roles = await localApp.entities.UserRole.filter({ user_email: u.email });
        if (roles.length > 0) setUserPermissions(roles[0].permissions);
      } catch {}
    };
    loadPerms();
  }, []);

  const isAdmin = user?.role === 'admin';
  const canViewCentralDados = isAdmin || userPermissions?.central_dados_visualizar;
  const canImport = isAdmin || userPermissions?.central_dados_importar;
  const userCarteira = employee?.carteira || null;

  const modulosVisiveis = MODULOS.filter(m => {
    if (isAdmin) return true;
    if (m.id === 'produtividade') return canViewCentralDados;
    if (m.id === 'historico') return canViewCentralDados;
    return !m.adminOnly;
  });

  /* ── Upload eKyte ── */
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.name.match(/\.csv$/i));
    if (!files.length) { alert('Selecione arquivos CSV exportados do eKyte.'); return; }
    setPendingFiles(prev => {
      const names = prev.map(f => f.name);
      return [...prev, ...files.filter(f => !names.includes(f.name))];
    });
    e.target.value = '';
  };

  const removeFile = (name) => setPendingFiles(prev => prev.filter(f => f.name !== name));

  function readAsText(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = () => rej(new Error('Erro ao ler arquivo'));
      r.readAsText(file, 'UTF-8');
    });
  }

  const handleProcessAll = async () => {
    if (!pendingFiles.length || isProcessing) return;
    setIsProcessing(true);
    setUploadLog([]);

    const existing = await localApp.entities.EkyteWorkspace.filter({ mes_referencia: competencia });
    const byKey = {};
    existing.forEach(r => { byKey[r.chave_unica] = r; });

    const dataImportacao = format(new Date(), 'yyyy-MM-dd');

    for (const file of pendingFiles) {
      const log = { name: file.name, status: 'processando', count: 0, created: 0, updated: 0, error: null };
      setUploadLog(prev => [...prev, { ...log }]);

      try {
        const text = await readAsText(file);
        const parsed = parseEkyteCsv(text, competencia, file.name);
        if (!parsed.length) throw new Error('Nenhum registro encontrado. Verifique se é um CSV de "Atividades por Workspace" do eKyte.');

        let created = 0, updated = 0;
        for (const row of parsed) {
          const rowComData = { ...row, ultima_atualizacao_arquivo: file.name };
          if (byKey[row.chave_unica]) {
            const updatedRow = await localApp.entities.EkyteWorkspace.update(byKey[row.chave_unica].id, rowComData);
            byKey[row.chave_unica] = updatedRow;
            updated++;
          } else {
            const createdRow = await localApp.entities.EkyteWorkspace.create(rowComData);
            byKey[row.chave_unica] = createdRow;
            created++;
          }
        }

        await localApp.entities.ImportRecord.create({
          file_name: file.name, file_type: 'csv',
          imported_by: user.email, imported_by_name: user.full_name,
          status: 'concluido', progress: 100,
          total_records: parsed.length,
          mes_referencia: competencia,
          records: [{ created, updated, data_importacao: dataImportacao }],
        });

        log.status = 'concluido';
        log.count = parsed.length;
        log.created = created;
        log.updated = updated;
      } catch (err) {
        log.status = 'erro';
        log.error = err.message;
      }
      setUploadLog(prev => prev.map(l => l.name === file.name ? { ...log } : l));
    }

    setPendingFiles([]);
    setIsProcessing(false);
    await loadData();
    setFilterMes(competencia);
    setProdTab('Dashboard');
  };

  const wsDoMes = workspaces.filter(w => w.mes_referencia === filterMes);
  const totalConcluidas = wsDoMes.reduce((s, w) => s + (w.concluidas || 0), 0);
  const totalNovas = wsDoMes.reduce((s, w) => s + (w.novas || 0), 0);
  const totalAtrasaram = wsDoMes.reduce((s, w) => s + (w.atrasaram || 0), 0);
  const totalPendentes = Math.max(totalNovas - totalConcluidas, 0);
  const _den = totalConcluidas + totalPendentes + totalAtrasaram;
  const pctGeral = _den > 0 ? Math.round((totalConcluidas / _den) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin && !canViewCentralDados) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
      <Database className="w-16 h-16 text-gray-600" />
      <h2 className="text-xl font-bold text-gray-400">Acesso restrito</h2>
      <p className="text-gray-500 max-w-sm">Você não tem permissão para acessar a Central de Dados. Solicite ao administrador.</p>
    </div>
  );

  const moduloAtual = MODULOS.find(m => m.id === activeModulo);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Database className="w-7 h-7 text-[#ff5000]" />
            Central de Dados
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Importe e gerencie dados de todos os módulos do sistema
          </p>
        </div>
      </div>

      {/* Módulos — grid de cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {modulosVisiveis.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveModulo(m.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${
              activeModulo === m.id
                ? 'border-[var(--border-color)] text-white'
                : 'border-white/5 text-gray-400 hover:text-white hover:border-white/15'
            }`}
            style={activeModulo === m.id ? { background: `${m.color}18`, borderColor: `${m.color}50` } : {}}
          >
            <m.icon className="w-5 h-5" style={activeModulo === m.id ? { color: m.color } : {}} />
            <span className="text-xs font-medium leading-tight">{m.label}</span>
            {activeModulo === m.id && (
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
            )}
          </button>
        ))}
      </div>

      {/* ── PRODUTIVIDADE ── */}
      {activeModulo === 'produtividade' && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 p-1 rounded-xl bg-[#1a1a2e] w-fit">
              {(canImport ? ['Dashboard', 'Importar'] : ['Dashboard']).map(tab => (
                <button key={tab} onClick={() => setProdTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${prodTab === tab ? 'gradient-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterMes} onValueChange={setFilterMes}>
                <SelectTrigger className="w-44 bg-[#1a1a2e] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMesesDisponiveis().map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link to="/CadastroSquads">
                <Button variant="ghost" className="border border-white/10 text-gray-400 hover:text-white">
                  <Settings className="w-4 h-4 mr-2" />Squads
                </Button>
              </Link>
              {canImport && (
                <Button onClick={() => setProdTab('Importar')} className="gradient-primary text-white">
                  <Upload className="w-4 h-4 mr-2" />Importar CSV
                </Button>
              )}
            </div>
          </div>

          {/* Dashboard eKyte */}
          {prodTab === 'Dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Conclusão Geral', value: `${pctGeral}%`, icon: TrendingUp, color: '#22c55e' },
                  { label: 'Tarefas Novas', value: totalNovas, icon: Clock, color: '#3b82f6' },
                  { label: 'Concluídas', value: totalConcluidas, icon: CheckCircle2, color: '#22c55e' },
                  { label: 'Pendentes / Em andamento', value: totalPendentes, icon: RefreshCw, color: '#f59e0b' },
                  { label: 'Atrasaram', value: totalAtrasaram, icon: AlertTriangle, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} className="glass-card rounded-2xl p-5">
                    <s.icon className="w-5 h-5 mb-3" style={{ color: s.color }} />
                    <p className="text-gray-400 text-xs">{s.label}</p>
                    <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {wsDoMes.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center text-gray-500">
                  <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Importe CSVs do eKyte para visualizar o dashboard por squad</p>
                  {isAdmin && (
                    <Button className="mt-4 gradient-primary text-white" onClick={() => setProdTab('Importar')}>
                      <Upload className="w-4 h-4 mr-2" />Importar agora
                    </Button>
                  )}
                </div>
              ) : (
                <SquadDashboard
                  workspaces={wsDoMes}
                  clienteSquads={clienteSquads}
                  onVinculoSaved={loadData}
                  userCarteira={userCarteira}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          )}

          {/* Importar eKyte */}
          {prodTab === 'Importar' && canImport && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-5 border border-[#ff5000]/20">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-[#ff5000]" />
                      Competência dos dados
                    </p>
                    <p className="text-xs text-gray-400">Informe o mês real dos dados do CSV — pode ser diferente da data de hoje.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={competencia} onValueChange={setCompetencia}>
                      <SelectTrigger className="w-52 bg-[#1a1a2e] border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMesesDisponiveis().map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-right text-xs text-gray-500">
                      <p>Data de importação</p>
                      <p className="text-white font-medium">{format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-blue-500/20 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300 space-y-1">
                  <p className="font-semibold text-blue-300">Importação eKyte — CSV de Atividades por Workspace</p>
                  <p>Cada importação <strong>substitui</strong> os dados do workspace na competência selecionada.</p>
                  <p className="text-gray-500">Encoding UTF-8 com BOM · Delimitador <code>;</code></p>
                </div>
              </div>

              <div onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  isProcessing ? 'border-[#ff5000]/40 bg-[#ff5000]/5' : 'border-white/10 hover:border-[#ff5000]/50 hover:bg-[#ff5000]/5'}`}>
                <FilePlus2 className="w-12 h-12 mx-auto mb-4 text-[#ff5000] opacity-70" />
                <p className="font-bold text-lg mb-1">Clique para adicionar CSVs</p>
                <p className="text-gray-400 text-sm">Pode selecionar múltiplos arquivos de uma vez</p>
                <input ref={fileInputRef} type="file" accept=".csv" multiple className="hidden" onChange={handleFilesSelected} />
              </div>

              {pendingFiles.length > 0 && (
                <div className="glass-card rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#ff5000]" />
                      {pendingFiles.length} arquivo(s) selecionado(s)
                    </h3>
                    <Button onClick={handleProcessAll} disabled={isProcessing} className="gradient-primary text-white">
                      {isProcessing
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Processando...</>
                        : <><Upload className="w-4 h-4 mr-2" />Importar para {getMesesDisponiveis().find(m => m.value === competencia)?.label || competencia}</>}
                    </Button>
                  </div>
                  {pendingFiles.map(f => (
                    <div key={f.name} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
                      <span className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />{f.name}
                        <span className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</span>
                      </span>
                      <button onClick={() => removeFile(f.name)} className="text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              {uploadLog.length > 0 && (
                <div className="glass-card rounded-2xl p-6 space-y-3">
                  <h3 className="font-bold mb-2">Resultado do processamento</h3>
                  {uploadLog.map(l => (
                    <div key={l.name} className="flex items-start gap-3 rounded-xl bg-black/20 px-4 py-3">
                      {l.status === 'processando' && <div className="w-4 h-4 border-2 border-[#ff5000] border-t-transparent rounded-full animate-spin mt-0.5" />}
                      {l.status === 'concluido' && <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />}
                      {l.status === 'erro' && <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />}
                      <div>
                        <p className="text-sm font-medium">{l.name}</p>
                        {l.status === 'concluido' && <p className="text-xs text-gray-400">{l.count} workspaces — {l.created} criados, {l.updated} atualizados</p>}
                        {l.status === 'erro' && <p className="text-xs text-red-400">{l.error}</p>}
                      </div>
                    </div>
                  ))}
                  {uploadLog.every(l => l.status !== 'processando') && (
                    <Button className="w-full mt-2 gradient-primary text-white" onClick={() => setProdTab('Dashboard')}>
                      Ver dashboard consolidado
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {activeModulo === 'historico' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#ff5000]" />Histórico de Importações
            </h2>
            <Button variant="ghost" size="sm" onClick={loadData} className="text-gray-400 hover:text-white">
              <RefreshCw className="w-4 h-4 mr-1" />Atualizar
            </Button>
          </div>
          <ImportHistoryTable imports={imports} />
        </div>
      )}

      {/* ── DEMAIS MÓDULOS (Em breve) ── */}
      {!['produtividade', 'historico'].includes(activeModulo) && moduloAtual && (
        <EmBreve modulo={moduloAtual} />
      )}
    </div>
  );
}