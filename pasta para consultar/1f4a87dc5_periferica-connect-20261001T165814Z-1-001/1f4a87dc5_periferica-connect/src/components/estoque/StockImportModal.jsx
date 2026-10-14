import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { localApp } from '@/api/localClient';

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          quantity: { type: 'number' },
          status: { type: 'string' },
          location: { type: 'string' },
          responsible_name: { type: 'string' },
          observations: { type: 'string' },
        }
      }
    }
  }
};

function normalizeCategory(cat) {
  if (!cat) return 'outros';
  const lower = cat.toLowerCase();
  if (lower.includes('inform') || lower.includes('comput') || lower.includes('notebook') || lower.includes('teclado')) return 'informatica';
  if (lower.includes('mobil') || lower.includes('mesa') || lower.includes('cadeira')) return 'mobiliario';
  if (lower.includes('audio') || lower.includes('vídeo') || lower.includes('video') || lower.includes('microfone') || lower.includes('câmera') || lower.includes('camera')) return 'audio_video';
  if (lower.includes('escrit')) return 'escritorio';
  if (lower.includes('estúdio') || lower.includes('estudio')) return 'estudio';
  if (lower.includes('ferr')) return 'ferramentas';
  return 'outros';
}

function normalizeStatus(s) {
  if (!s) return 'em_estoque';
  const lower = s.toLowerCase();
  if (lower.includes('manut')) return 'em_manutencao';
  if (lower.includes('funcion') || lower.includes('emprest')) return 'com_funcionario';
  if (lower.includes('descart') || lower.includes('inativ')) return 'descartado';
  return 'em_estoque';
}

export default function StockImportModal({ inline, user, onImportDone, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const animateProgress = (from, to, duration) =>
    new Promise(resolve => {
      const steps = 20;
      const step = (to - from) / steps;
      const interval = duration / steps;
      let current = from;
      const timer = setInterval(() => {
        current = Math.min(current + step, to);
        setProgress(Math.round(current));
        if (current >= to) { clearInterval(timer); resolve(); }
      }, interval);
    });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('uploading');
    setProgress(0);

    try {
      const { file_url } = await localApp.integrations.Core.UploadFile({ file });
      await animateProgress(0, 35, 800);

      const extracted = await localApp.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: SCHEMA
      });
      await animateProgress(35, 80, 1000);

      let rawItems = [];
      if (extracted.status === 'success') {
        rawItems = Array.isArray(extracted.output) ? extracted.output : (extracted.output?.items || []);
      }

      const now = new Date().toISOString();
      const toCreate = rawItems.map(item => ({
        name: item.name || 'Item sem nome',
        code: item.code || '',
        category: normalizeCategory(item.category),
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        status: normalizeStatus(item.status),
        location: item.location || '',
        responsible_name: item.responsible_name || '',
        observations: item.observations || '',
        registered_by: user?.email || '',
        registered_by_name: user?.full_name || '',
        history: [{
          field: 'criacao',
          change_type: 'criacao',
          old_value: '',
          new_value: item.name || 'Item importado',
          user_email: user?.email || '',
          user_name: user?.full_name || '',
          reason: `Importado via arquivo: ${file.name}`,
          timestamp: now,
        }]
      }));

      if (toCreate.length > 0) {
        await localApp.entities.StockItem.bulkCreate(toCreate);
      }

      await animateProgress(80, 100, 500);
      setImportedCount(toCreate.length);
      setStatus('done');
      onImportDone?.();
    } catch (err) {
      setStatus('error');
    }
    e.target.value = '';
  };

  const content = (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onClick={() => status !== 'uploading' && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          status === 'uploading'
            ? 'border-[#ff5000]/40 bg-[#ff5000]/5 cursor-not-allowed'
            : 'border-white/10 hover:border-[#ff5000]/50 hover:bg-[#ff5000]/5'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-[#ff5000] opacity-70" />
        <p className="font-bold text-lg mb-1">Clique para selecionar arquivo</p>
        <p className="text-gray-400 text-sm">Suportado: PDF, Excel (.xlsx) e CSV</p>
        <p className="text-gray-500 text-xs mt-2">Os itens serão lidos automaticamente e cadastrados no estoque</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />

      {/* Progress */}
      {status === 'uploading' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 space-y-3"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#ff5000]" />
            <div className="flex-1">
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-gray-400">Processando com IA...</p>
            </div>
            <span className="text-2xl font-black text-[#ff5000]">{progress}%</span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(135deg, #ff5000, #ff7f40)', width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Done */}
      {status === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 text-center border border-green-500/20"
        >
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="font-bold text-lg text-green-400">Importação concluída!</p>
          <p className="text-gray-400 text-sm mt-1">{importedCount} itens importados com sucesso</p>
        </motion.div>
      )}

      {/* Error */}
      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 text-center border border-red-500/20"
        >
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-bold text-lg text-red-400">Erro na importação</p>
          <p className="text-gray-400 text-sm mt-1">Verifique o arquivo e tente novamente</p>
          <Button
            className="mt-4 gradient-primary text-white"
            onClick={() => { setStatus('idle'); setProgress(0); }}
          >
            Tentar novamente
          </Button>
        </motion.div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={e => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card rounded-2xl w-full max-w-lg"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-[#ff5000]" />
              <h2 className="font-bold text-lg">Importar Itens</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">{content}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}