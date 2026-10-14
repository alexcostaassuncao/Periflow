import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle2, AlertTriangle, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { localApp } from '@/api/localClient';

const STATUS_CONFIG = {
  aguardando: { label: 'Aguardando', color: '#6b7280', icon: Clock },
  processando: { label: 'Processando...', color: '#f59e0b', icon: Clock },
  concluido: { label: 'Concluído', color: '#22c55e', icon: CheckCircle2 },
  erro: { label: 'Erro', color: '#ef4444', icon: AlertTriangle },
};

const VALID_CATEGORIAS = ['informatica', 'mobiliario', 'eletronico', 'audio_video', 'comunicacao', 'ferramenta', 'papelaria', 'outros'];
const VALID_LOCALIZACOES = ['estoque', 'com_funcionario', 'manutencao', 'descartado'];

function buildChaveUnica(it) {
  if (it.numero_serie) return `serie:${it.numero_serie.trim()}`;
  if (it.codigo) return `cod:${it.codigo.trim()}`;
  const nome = (it.nome || '').trim().toUpperCase();
  const modelo = (it.modelo || '').trim().toUpperCase();
  const resp = (it.responsavel || it.funcionario_responsavel_nome || '').trim().toUpperCase();
  return `combo:${nome}|${modelo}|${resp}`;
}

export default function EstoqueImportTab({ user, onImportDone }) {
  const [currentImport, setCurrentImport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imports, setImports] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    const data = await localApp.entities.EquipamentoImport.list('-created_date', 20);
    setImports(data);
  };

  const animateProgress = (from, to, duration) => {
    return new Promise(resolve => {
      const steps = 20;
      const step = (to - from) / steps;
      const interval = duration / steps;
      let current = from;
      const timer = setInterval(() => {
        current = Math.min(current + step, to);
        setCurrentImport(p => p ? { ...p, progress: Math.round(current) } : p);
        if (current >= to) { clearInterval(timer); resolve(); }
      }, interval);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const fileType = ext === 'pdf' ? 'pdf' : ext === 'csv' ? 'csv' : 'xlsx';

    setUploading(true);

    const record = await localApp.entities.EquipamentoImport.create({
      file_name: file.name,
      file_type: fileType,
      imported_by: user.email,
      imported_by_name: user.full_name,
      status: 'processando',
      progress: 0,
    });
    setCurrentImport({ ...record });

    try {
      const { file_url } = await localApp.integrations.Core.UploadFile({ file });
      await animateProgress(0, 30, 800);

      // Schema detalhado para extração de inventário
      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nome: { type: 'string', description: 'Nome do item ou equipamento' },
                codigo: { type: 'string', description: 'Código de patrimônio ou identificador' },
                numero_serie: { type: 'string', description: 'Número de série' },
                categoria: { type: 'string', description: 'Categoria: informatica, mobiliario, eletronico, audio_video, comunicacao, ferramenta, papelaria, outros' },
                modelo: { type: 'string', description: 'Modelo do equipamento' },
                marca: { type: 'string', description: 'Marca do equipamento' },
                descricao: { type: 'string', description: 'Descrição detalhada' },
                quantidade: { type: 'number', description: 'Quantidade' },
                localizacao: { type: 'string', description: 'Localização: estoque, com_funcionario, manutencao, descartado' },
                responsavel: { type: 'string', description: 'Nome do funcionário responsável' },
                setor: { type: 'string', description: 'Setor ou departamento' },
                status: { type: 'string', description: 'Status: ativo, inativo' },
                observacoes: { type: 'string', description: 'Observações gerais' },
                data_aquisicao: { type: 'string', description: 'Data de aquisição' },
              }
            }
          }
        }
      };

      const extracted = await localApp.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema: schema });
      await animateProgress(30, 75, 1200);

      let itemsExtraidos = [];
      if (extracted.status === 'success') {
        itemsExtraidos = Array.isArray(extracted.output) ? extracted.output : (extracted.output?.items || []);
      }

      if (!itemsExtraidos.length) {
        throw new Error('Nenhum item encontrado no arquivo. Verifique se é um arquivo de inventário/estoque válido.');
      }

      // Busca itens existentes para upsert
      const existentes = await localApp.entities.EquipamentoItem.list('-updated_date', 500);
      // Mapa por chave única
      const existMap = {};
      existentes.forEach(ex => {
        const chave = buildChaveUnica({
          numero_serie: ex.codigo?.startsWith('serie:') ? ex.codigo.replace('serie:', '') : '',
          codigo: ex.codigo,
          nome: ex.nome,
          modelo: ex.descricao, // fallback
          responsavel: ex.funcionario_responsavel_nome,
        });
        existMap[chave] = ex;
        // Também indexar pelo código direto
        if (ex.codigo) existMap[`cod:${ex.codigo.trim()}`] = ex;
      });

      const now = new Date().toISOString();
      let criados = 0, atualizados = 0;

      for (const it of itemsExtraidos) {
        if (!it.nome) continue;

        const cat = VALID_CATEGORIAS.includes(it.categoria) ? it.categoria : 'outros';
        const loc = VALID_LOCALIZACOES.includes(it.localizacao) ? it.localizacao : 'estoque';
        const chave = buildChaveUnica(it);

        const dadosBase = {
          nome: it.nome,
          codigo: it.codigo || it.numero_serie || '',
          categoria: cat,
          descricao: [it.descricao, it.marca && `Marca: ${it.marca}`, it.modelo && `Modelo: ${it.modelo}`, it.setor && `Setor: ${it.setor}`].filter(Boolean).join(' | ') || '',
          quantidade: it.quantidade || 1,
          localizacao: loc,
          funcionario_responsavel_nome: it.responsavel || '',
          observacoes: it.observacoes || (it.data_aquisicao ? `Adquirido em: ${it.data_aquisicao}` : ''),
          status: it.status === 'inativo' ? 'inativo' : 'ativo',
          importado_de: record.id,
        };

        const existente = existMap[chave];

        if (existente) {
          // Upsert: atualizar campos alterados
          const histEntry = {
            tipo_alteracao: 'atualizacao_importacao',
            usuario_email: user.email,
            usuario_nome: user.full_name,
            data_hora: now,
            motivo: `Importado de: ${file.name}`,
          };
          const novoHistorico = [...(existente.historico || []), histEntry];
          await localApp.entities.EquipamentoItem.update(existente.id, { ...dadosBase, historico: novoHistorico });
          atualizados++;
        } else {
          // Criar novo
          await localApp.entities.EquipamentoItem.create({
            ...dadosBase,
            cadastrado_por: user.email,
            cadastrado_por_nome: user.full_name,
            historico: [{
              tipo_alteracao: 'importacao',
              usuario_email: user.email,
              usuario_nome: user.full_name,
              data_hora: now,
              motivo: `Importado de: ${file.name}`,
            }],
          });
          criados++;
        }
      }

      await animateProgress(75, 100, 500);
      await localApp.entities.EquipamentoImport.update(record.id, {
        status: 'concluido', progress: 100, file_url,
        total_records: itemsExtraidos.length,
      });
      setCurrentImport(p => ({ ...p, status: 'concluido', progress: 100, total_records: itemsExtraidos.length, criados, atualizados }));
      onImportDone();
    } catch (err) {
      await localApp.entities.EquipamentoImport.update(record.id, { status: 'erro', error_message: err.message });
      setCurrentImport(p => ({ ...p, status: 'erro', progress: 0, errorMsg: err.message }));
    } finally {
      setUploading(false);
      loadHistory();
    }
    e.target.value = '';
  };

  const StatusIcon = currentImport ? (STATUS_CONFIG[currentImport.status]?.icon || Clock) : null;

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="glass-card rounded-2xl p-4 border border-blue-500/20 flex gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300 space-y-1">
          <p className="font-semibold text-blue-300">Importação de Inventário/Estoque</p>
          <p>Envie um arquivo CSV, Excel (.xlsx) ou PDF com a lista de equipamentos. O sistema identifica automaticamente os campos e faz <strong>upsert</strong> (cria ou atualiza) sem duplicar itens.</p>
          <p className="text-gray-500">Chave única: número de série → código/patrimônio → nome + modelo + responsável</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          uploading ? 'border-[#ff5000]/40 bg-[#ff5000]/5' : 'border-white/10 hover:border-[#ff5000]/50 hover:bg-[#ff5000]/5'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-[#ff5000] opacity-70" />
        <p className="font-bold text-lg mb-1">Clique para selecionar um arquivo de inventário</p>
        <p className="text-gray-400 text-sm">Suportado: PDF, Excel (.xlsx) e CSV com dados de equipamentos</p>
        <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Progresso atual */}
      {currentImport && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            {StatusIcon && <StatusIcon className="w-5 h-5" style={{ color: STATUS_CONFIG[currentImport.status]?.color }} />}
            <div className="flex-1">
              <p className="font-medium">{currentImport.file_name}</p>
              <p className="text-xs" style={{ color: STATUS_CONFIG[currentImport.status]?.color }}>
                {STATUS_CONFIG[currentImport.status]?.label}
              </p>
            </div>
            {currentImport.status === 'concluido' && (
              <div className="text-right">
                <span className="text-sm text-green-400 font-bold block">{currentImport.total_records} itens</span>
                {currentImport.criados !== undefined && (
                  <span className="text-xs text-gray-400">{currentImport.criados} criados · {currentImport.atualizados} atualizados</span>
                )}
              </div>
            )}
          </div>
          {currentImport.status === 'erro' ? (
            <p className="text-sm text-red-400">{currentImport.errorMsg}</p>
          ) : (
            <div className="relative h-6 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-primary"
                animate={{ width: `${currentImport.progress}%` }}
                transition={{ duration: 0.3 }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {currentImport.progress}%
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Histórico de importações */}
      {imports.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#ff5000]" />
            Histórico de Importações
          </h3>
          <div className="space-y-3">
            {imports.map(imp => {
              const sc = STATUS_CONFIG[imp.status] || STATUS_CONFIG.aguardando;
              const Icon = sc.icon;
              return (
                <div key={imp.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" style={{ color: sc.color }} />
                    <div>
                      <p className="text-sm font-medium">{imp.file_name}</p>
                      <p className="text-xs text-gray-500">{imp.imported_by_name} · {imp.total_records || 0} itens</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: sc.color }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}