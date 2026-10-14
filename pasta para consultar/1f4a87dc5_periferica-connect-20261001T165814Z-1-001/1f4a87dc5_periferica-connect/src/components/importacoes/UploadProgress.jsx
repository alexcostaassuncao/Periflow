import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function UploadProgress({ status, progress, fileName }) {
  const getColor = () => {
    if (status === 'erro') return '#ef4444';
    if (status === 'concluido') return '#22c55e';
    return '#ff5000';
  };

  const getLabel = () => {
    if (status === 'aguardando') return 'Aguardando processamento...';
    if (status === 'processando') return `Processando dados... ${progress}%`;
    if (status === 'concluido') return 'Importação concluída com sucesso!';
    if (status === 'erro') return 'Erro na importação';
    return '';
  };

  const color = getColor();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-card p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400 truncate max-w-[60%]">{fileName}</p>
          {status === 'processando' && <Loader2 className="w-4 h-4 animate-spin text-[#ff5000]" />}
          {status === 'concluido' && <CheckCircle className="w-5 h-5 text-green-400" />}
          {status === 'erro' && <XCircle className="w-5 h-5 text-red-400" />}
        </div>

        {/* Big progress bar */}
        <div className="relative h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-xl"
            style={{ backgroundColor: color, opacity: 0.85 }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Shimmer */}
          {status === 'processando' && (
            <motion.div
              className="absolute inset-y-0 w-20 bg-white/20 skew-x-12"
              animate={{ left: ['-10%', '110%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {/* Percentage label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black text-white drop-shadow-lg">
              {progress}%
            </span>
          </div>
        </div>

        <p className="text-center text-sm font-medium" style={{ color }}>
          {getLabel()}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}