import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  Zap,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const priorityConfig = {
  alta: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'Alta' },
  media: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: 'Média' },
  baixa: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', label: 'Baixa' }
};

const statusConfig = {
  a_fazer: { icon: Circle, color: 'text-gray-400', label: 'A Fazer' },
  em_andamento: { icon: Clock, color: 'text-blue-400', label: 'Em Andamento' },
  em_revisao: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Em Revisão' },
  aguardando_aprovacao: { icon: Clock, color: 'text-purple-400', label: 'Aguardando Aprovação' },
  concluida: { icon: CheckCircle2, color: 'text-green-400', label: 'Concluída' }
};

const categoryLabels = {
  social_media: 'Social Media',
  design: 'Design',
  trafego: 'Tráfego',
  atendimento: 'Atendimento',
  gestao: 'Gestão'
};

export default function TaskCard({ task, onClick, onStatusChange, onEdit, onDelete }) {
  const priority = priorityConfig[task.priority] || priorityConfig.media;
  const status = statusConfig[task.status] || statusConfig.a_fazer;
  const StatusIcon = status.icon;

  const completedChecklist = task.checklist?.filter(item => item.completed).length || 0;
  const totalChecklist = task.checklist?.length || 0;

  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'concluida';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={`glass-card rounded-xl p-4 cursor-pointer hover:border-[#ff5000]/30 transition-all ${
        isOverdue ? 'border-red-500/50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <span className={`text-xs px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
            {priority.label}
          </span>
          {isOverdue && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
              Atrasada
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="p-1 rounded hover:bg-white/10">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a1a2e] border-[#ff5000]/20">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(task); }} className="text-white hover:bg-[#ff5000]/20">
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onStatusChange?.(task, 'em_andamento'); }} 
              className="text-white hover:bg-[#ff5000]/20"
            >
              Iniciar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onStatusChange?.(task, 'concluida'); }} 
              className="text-green-400 hover:bg-green-500/20"
            >
              Concluir
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete?.(task); }} 
              className="text-red-400 hover:bg-red-500/20"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h4 className="font-semibold mb-2 line-clamp-2">{task.title}</h4>
      
      {task.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs px-2 py-1 rounded-lg bg-[#ff5000]/10 text-[#ff5000]">
          {categoryLabels[task.category] || task.category}
        </span>
        {task.client_name && (
          <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400">
            {task.client_name}
          </span>
        )}
      </div>

      {totalChecklist > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Checklist</span>
            <span className="text-gray-400">{completedChecklist}/{totalChecklist}</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full gradient-primary transition-all"
              style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
          </span>
          {task.current_event_index !== undefined && task.events && (
            <>
              <span>•</span>
              <span>{task.events[task.current_event_index]?.name || 'Iniciando'}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-[#ff5000]">
          <Zap className="w-3 h-3" />
          <span>+{task.xp_reward || 50} XP</span>
        </div>
      </div>
    </motion.div>
  );
}