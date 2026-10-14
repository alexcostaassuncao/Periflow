import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EventTimeline({ events, currentEventIndex, onMoveNext, onMovePrevious }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getEventStatus = (event, index) => {
    if (event.status === 'completed') return 'completed';
    if (index === currentEventIndex) return 'current';
    if (index < currentEventIndex) return 'completed';
    return 'pending';
  };

  const getStatusColor = (status, event) => {
    if (status === 'completed') return 'bg-yellow-500';
    if (status === 'current') {
      if (event.due_date && new Date(event.due_date) < new Date()) return 'bg-red-500';
      return 'bg-green-500';
    }
    return 'bg-gray-400';
  };

  const handleEventClick = (index) => {
    if (index === currentEventIndex) {
      setSelectedEvent(selectedEvent === index ? null : index);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-lg">Workflow da Tarefa</h4>
      
      <div className="glass-card rounded-2xl p-6 overflow-x-auto">
        {/* Timeline Horizontal */}
        <div className="flex items-start gap-4 min-w-max">
          {events?.map((event, index) => {
            const status = getEventStatus(event, index);
            const statusColor = getStatusColor(status, event);
            const isSelected = selectedEvent === index;
            const isCurrent = index === currentEventIndex;

            return (
              <React.Fragment key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  {/* Avatar e Status */}
                  <div
                    onClick={() => handleEventClick(index)}
                    className={`relative cursor-pointer transition-all ${
                      isCurrent ? 'ring-4 ring-[#ff5000] ring-offset-2 ring-offset-[#0a0a0f] rounded-full' : ''
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full ${statusColor} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {event.executor_email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {status === 'completed' && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info do Evento */}
                  <div className="mt-3 text-center max-w-[120px]">
                    <p className="font-medium text-sm">{event.name}</p>
                    <p className="text-xs text-gray-500 truncate">{event.executor_email?.split('@')[0]}</p>
                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-400">
                      {event.duration_days && <span>{event.duration_days}d</span>}
                      {event.estimated_time && (
                        <>
                          <span>•</span>
                          <span>{Math.floor(event.estimated_time / 60)}h</span>
                        </>
                      )}
                    </div>
                    {event.uses_timer && event.time_spent > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{Math.floor(event.time_spent / 60)}min</span>
                      </div>
                    )}
                    {event.due_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>

                  {/* Ações expandidas */}
                  {isSelected && isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex gap-2"
                    >
                      {index > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMovePrevious(index)}
                          className="border-white/10"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                      )}
                      {index < events.length - 1 && (
                        <Button
                          size="sm"
                          onClick={() => onMoveNext(index)}
                          className="gradient-primary"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* Seta conectora */}
                {index < events.length - 1 && (
                  <div className="flex items-center pt-8">
                    <ChevronRight className={`w-6 h-6 ${
                      index < currentEventIndex ? 'text-yellow-500' : 'text-gray-600'
                    }`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}