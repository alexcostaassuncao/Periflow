import React from 'react';
import { motion } from 'framer-motion';
import { Package, Users, Wrench, Trash2, Archive } from 'lucide-react';

export default function EstoqueStats({ items }) {
  const ativos = items.filter(i => i.status !== 'excluido');
  const emEstoque = ativos.filter(i => i.localizacao === 'estoque').length;
  const comFuncionario = ativos.filter(i => i.localizacao === 'com_funcionario').length;
  const emManutencao = ativos.filter(i => i.localizacao === 'manutencao').length;
  const inativos = items.filter(i => i.status === 'excluido' || i.localizacao === 'descartado').length;

  const stats = [
    { label: 'Total de Itens', value: ativos.length, icon: Archive, color: '#ff5000' },
    { label: 'Em Estoque', value: emEstoque, icon: Package, color: '#22c55e' },
    { label: 'Com Funcionários', value: comFuncionario, icon: Users, color: '#3b82f6' },
    { label: 'Em Manutenção', value: emManutencao, icon: Wrench, color: '#f59e0b' },
    { label: 'Inativos/Descartados', value: inativos, icon: Trash2, color: '#6b7280' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card rounded-2xl p-4"
        >
          <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
          <p className="text-gray-400 text-xs">{s.label}</p>
          <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
        </motion.div>
      ))}
    </div>
  );
}