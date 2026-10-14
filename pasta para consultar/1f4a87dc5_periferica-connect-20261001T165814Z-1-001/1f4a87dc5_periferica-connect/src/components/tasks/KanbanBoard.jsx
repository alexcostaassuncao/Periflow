import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import TaskKanbanCard from './TaskKanbanCard';

const COLUMNS = [
  { key: 'a_fazer',              label: 'Backlog',      color: '#6b7280', light: 'rgba(107,114,128,0.15)' },
  { key: 'em_andamento',         label: 'Em Andamento', color: '#3b82f6', light: 'rgba(59,130,246,0.15)'  },
  { key: 'em_revisao',           label: 'Em Revisão',   color: '#eab308', light: 'rgba(234,179,8,0.15)'   },
  { key: 'aguardando_aprovacao', label: 'Aprovado',     color: '#a855f7', light: 'rgba(168,85,247,0.15)'  },
  { key: 'concluida',            label: 'Concluído',    color: '#22c55e', light: 'rgba(34,197,94,0.15)'   },
];

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onNewTask }) {
  const [dragging, setDragging] = useState(false);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const handleDragEnd = (result) => {
    setDragging(false);
    if (!result.destination) return;
    const srcCol  = result.source.droppableId;
    const dstCol  = result.destination.droppableId;
    if (srcCol === dstCol) return;

    const task = tasks.find(t => t.id === result.draggableId);
    if (task) onStatusChange(task, dstCol);
  };

  return (
    <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={handleDragEnd}>
      <div className="task-board-scrollbar flex min-h-[70vh] gap-4 overflow-x-auto pb-6">
        {COLUMNS.map(col => {
          const colTasks = grouped[col.key] || [];
          return (
            <div
              key={col.key}
              className="flex-shrink-0 w-72 flex flex-col rounded-2xl"
              style={{ background: 'rgba(18,18,26,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Column Header */}
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-t-2xl"
                style={{ borderTop: `3px solid ${col.color}`, background: col.light }}
              >
                <span className="font-semibold text-sm text-white flex-1">{col.label}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: col.color + '33', color: col.color }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 overflow-y-auto px-3 py-3 space-y-3 transition-colors"
                    style={{
                      minHeight: 120,
                      background: snapshot.isDraggingOver ? col.light : 'transparent',
                      borderRadius: '0 0 1rem 1rem'
                    }}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            style={{
                              ...prov.draggableProps.style,
                              opacity: snap.isDragging ? 0.85 : 1,
                            }}
                          >
                            <TaskKanbanCard task={task} onClick={() => onTaskClick(task)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-center text-gray-600 text-xs py-6 select-none">
                        Sem tarefas
                      </p>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Add button per column */}
              <button
                onClick={() => onNewTask?.(col.key)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-all rounded-b-2xl border-t border-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar tarefa
              </button>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}