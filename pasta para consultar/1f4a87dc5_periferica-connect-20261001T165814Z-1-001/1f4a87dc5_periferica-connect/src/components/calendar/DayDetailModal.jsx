import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X, DollarSign, Video, UserX, Building2, CheckSquare,
  Clock, MapPin, User, Plus, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  {
    id: 'comercial',
    label: 'Reuniões Comerciais',
    icon: DollarSign,
    color: '#6366f1',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    iconColor: 'text-indigo-400',
  },
  {
    id: 'videomaker',
    label: 'Agenda dos Videomakers',
    icon: Video,
    color: '#a855f7',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    iconColor: 'text-purple-400',
  },
  {
    id: 'ausencias',
    label: 'Ausências de Funcionários',
    icon: UserX,
    color: '#ef4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
  },
  {
    id: 'interno',
    label: 'Eventos Internos',
    icon: Building2,
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  {
    id: 'tarefas',
    label: 'Tarefas com Prazo',
    icon: CheckSquare,
    color: '#ff5000',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    iconColor: 'text-orange-400',
  },
];

function formatTime(dt) {
  try { return format(new Date(dt), 'HH:mm'); } catch { return ''; }
}

function EventItem({ event, category }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${category.bg} border ${category.border}`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white">{event.title}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          {event.start_datetime && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTime(event.start_datetime)}
              {event.end_datetime && ` — ${formatTime(event.end_datetime)}`}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />{event.location}
            </span>
          )}
          {event.responsible && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <User className="w-3 h-3" />{event.responsible}
            </span>
          )}
          {event.meeting_link && (
            <a
              href={event.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:underline"
            >
              <LinkIcon className="w-3 h-3" />Meet
            </a>
          )}
          {event.client_name && (
            <span className="text-xs text-gray-500">📌 {event.client_name}</span>
          )}
          {event.due_date && (
            <span className="text-xs text-gray-500">Prazo: {format(new Date(event.due_date), 'dd/MM')}</span>
          )}
          {event.responsible_email && (
            <span className="text-xs text-gray-500">👤 {event.responsible_email}</span>
          )}
        </div>
        {event.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  );
}

function CategorySection({ category, items }) {
  if (items.length === 0) return null;
  const Icon = category.icon;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${category.bg}`}>
          <Icon className={`w-4 h-4 ${category.iconColor}`} />
        </div>
        <h4 className="font-semibold text-sm text-white">{category.label}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full ${category.bg} ${category.iconColor}`}>
          {items.length}
        </span>
      </div>
      <div className="space-y-2 pl-9">
        {items.map((item, i) => (
          <EventItem key={item.id || i} event={item} category={category} />
        ))}
      </div>
    </div>
  );
}

export default function DayDetailModal({ date, events, tasks, crmLeads, onClose, onNewEvent }) {
  if (!date) return null;

  // --- Classificar eventos por categoria ---
  const comercial = events.filter(e =>
    e.event_type === 'reuniao_comercial' || e.event_type === 'reuniao_externa'
  ).map(e => ({
    ...e,
    responsible: e.created_by || '',
    client_name: e.prospect_name || e.client_id || '',
  }));

  // CRM leads com data_reuniao neste dia
  const crmReunioes = (crmLeads || []).filter(l => {
    if (!l.data_reuniao) return false;
    try {
      const d = new Date(l.data_reuniao);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    } catch { return false; }
  }).map(l => ({
    id: l.id,
    title: `Reunião — ${l.nome_empresa || l.nome_contato}`,
    start_datetime: l.data_reuniao,
    responsible: l.responsavel_nome || l.responsavel_email || '',
    client_name: l.nome_empresa || '',
    description: l.observacoes_reuniao || '',
  }));

  const allComercial = [...comercial, ...crmReunioes];

  const videomaker = events.filter(e =>
    e.event_type === 'gravacao_interna' || e.event_type === 'gravacao_externa'
  ).map(e => ({
    ...e,
    responsible: e.video_maker
      ? (e.video_maker === 'julio' ? 'Júlio' : e.video_maker === 'eduardo' ? 'Eduardo' : e.video_maker)
      : '',
  }));

  const ausencias = events.filter(e =>
    e.event_type === 'falta' || e.event_type === 'ausencia'
  ).map(e => ({
    ...e,
    responsible: e.participants?.join(', ') || e.created_by || '',
  }));

  const interno = events.filter(e =>
    e.event_type === 'reuniao_interna' || e.event_type === 'conteudo_programado' ||
    e.event_type === 'conteudo_publicado'
  );

  const tarefas = tasks.map(t => ({
    ...t,
    title: t.title,
    due_date: t.due_date,
    responsible_email: t.responsible_email,
    client_name: t.client_name || '',
  }));

  const categoryData = {
    comercial: allComercial,
    videomaker,
    ausencias,
    interno,
    tarefas,
  };

  const totalItems = Object.values(categoryData).reduce((s, a) => s + a.length, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#12121a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-white">
                Agenda do dia — {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {totalItems === 0 ? 'Nenhum item agendado' : `${totalItems} item${totalItems > 1 ? 's' : ''} agendado${totalItems > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onNewEvent}
                className="gradient-primary text-white text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />Novo Evento
              </Button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <CheckSquare className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 font-medium">Nenhum evento neste dia</p>
                <p className="text-gray-600 text-sm mt-1">Clique em "Novo Evento" para agendar algo.</p>
              </div>
            ) : (
              CATEGORIES.map(cat => (
                <CategorySection
                  key={cat.id}
                  category={cat}
                  items={categoryData[cat.id] || []}
                />
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}