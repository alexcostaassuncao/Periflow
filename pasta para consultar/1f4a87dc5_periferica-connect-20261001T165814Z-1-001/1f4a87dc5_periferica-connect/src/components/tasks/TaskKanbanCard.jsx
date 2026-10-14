import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Zap, AlertTriangle, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const priorityConfig = {
  alta:  { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   label: 'Alta'  },
  media: { color: '#eab308', bg: 'rgba(234,179,8,0.15)',   label: 'Média' },
  baixa: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   label: 'Baixa' },
};

// Tag por palavras-chave no título / tipo de evento
const getTag = (task) => {
  const title = (task.title || '').toLowerCase();
  const hasVideo = task.events?.some(e => e.event_type?.includes('video') || e.event_type?.includes('captacao'));
  const hasDesign = task.events?.some(e => e.event_type === 'design');
  const hasCopy = task.events?.some(e => e.event_type === 'redacao');

  if (hasVideo || title.includes('vídeo') || title.includes('video'))
    return { label: 'Vídeo',    bg: 'rgba(168,85,247,0.2)',  color: '#a855f7' };
  if (hasDesign || title.includes('design'))
    return { label: 'Design',   bg: 'rgba(59,130,246,0.2)',  color: '#3b82f6' };
  if (hasCopy || title.includes('copy') || title.includes('redaç'))
    return { label: 'Copy',     bg: 'rgba(255,80,0,0.2)',    color: '#ff5000' };
  if (title.includes('comercial') || title.includes('proposta'))
    return { label: 'Comercial',bg: 'rgba(34,197,94,0.2)',   color: '#22c55e' };
  return null;
};

export default function TaskKanbanCard({ task, onClick }) {
  const priority  = priorityConfig[task.priority] || priorityConfig.media;
  const tag       = getTag(task);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'concluida';

  // Progress from events
  const totalEvents     = task.events?.length || 0;
  const completedEvents = task.events?.filter(e => e.status === 'completed').length || 0;
  const progress        = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

  // Initials avatar
  const initials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  };

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
      onClick={onClick}
      className="rounded-xl p-3.5 cursor-pointer select-none transition-all"
      style={{
        background: '#1a1a2e',
        border: isOverdue
          ? '1px solid rgba(239,68,68,0.5)'
          : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Top row: priority dot + tag + overdue */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: priority.color }}
        />
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
          style={{ background: priority.bg, color: priority.color }}
        >
          {priority.label}
        </span>
        {tag && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{ background: tag.bg, color: tag.color }}
          >
            {tag.label}
          </span>
        )}
        {isOverdue && (
          <span className="flex items-center gap-0.5 text-[10px] text-red-400 ml-auto">
            <AlertTriangle className="w-3 h-3" />
            Atrasada
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm text-white leading-snug line-clamp-2 mb-1.5">
        {task.title}
      </h4>

      {/* Client */}
      {task.client_name && (
        <p className="text-xs text-gray-500 mb-2 truncate">
          📁 {task.client_name}
        </p>
      )}

      {/* Progress bar */}
      {totalEvents > 0 && (
        <div className="mb-2.5">
          <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              Etapas
            </span>
            <span>{completedEvents}/{totalEvents}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: progress === 100 ? '#22c55e' : '#ff5000',
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        {/* Due date */}
        <div className="flex items-center gap-1 text-[11px]" style={{ color: isOverdue ? '#ef4444' : '#6b7280' }}>
          <Calendar className="w-3 h-3" />
          {task.due_date
            ? format(new Date(task.due_date), 'dd MMM', { locale: ptBR })
            : '—'}
        </div>

        {/* Avatar + XP */}
        <div className="flex items-center gap-2">
          {task.responsible_email && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ff5000,#ff7f40)' }}
              title={task.responsible_email}
            >
              {initials(task.responsible_email.split('@')[0])}
            </div>
          )}
          <span className="text-[10px] text-[#ff5000] flex items-center gap-0.5">
            <Zap className="w-3 h-3" />
            {task.xp_reward || 50}
          </span>
        </div>
      </div>
    </motion.div>
  );
}