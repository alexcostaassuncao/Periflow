import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Pin, Check, Trash2, Calendar, DollarSign, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, [userEmail]);

  const loadNotifications = async () => {
    try {
      const data = await localApp.entities.Notification.filter(
        { user_email: userEmail },
        '-created_date',
        50
      );
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    await localApp.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const togglePin = async (id, isPinned) => {
    await localApp.entities.Notification.update(id, { is_pinned: !isPinned });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_pinned: !isPinned } : n));
  };

  const deleteNotification = async (id) => {
    await localApp.entities.Notification.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = async () => {
    setLoading(true);
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => localApp.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setLoading(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'reuniao': return Calendar;
      case 'comercial': return DollarSign;
      case 'mencao': return Users;
      case 'lembrete': return AlertCircle;
      case 'acao_confirmada': return CheckCircle2;
      default: return Bell;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'reuniao': return 'text-blue-400';
      case 'comercial': return 'text-green-400';
      case 'mencao': return 'text-purple-400';
      case 'lembrete': return 'text-orange-400';
      case 'acao_confirmada': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  const filteredNotifications = notifications
    .filter(n => filter === 'all' || n.type === filter)
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowPanel(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-[#12121a] border-l border-white/10 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-lg">Notificações</h3>
                  <p className="text-xs text-gray-400">{unreadCount} não lida(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={loading}
                      className="text-xs text-[#ff5000] hover:text-[#cc4000] disabled:opacity-50"
                    >
                      Marcar todas
                    </button>
                  )}
                  <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 p-3 border-b border-white/10 overflow-x-auto">
                {['all', 'reuniao', 'comercial', 'mencao', 'lembrete', 'acao_confirmada'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      filter === type 
                        ? 'bg-[#ff5000] text-white' 
                        : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
                    }`}
                  >
                    {type === 'all' ? 'Todas' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredNotifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  const colorClass = getColor(notification.type);

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl transition-all ${
                        notification.is_pinned 
                          ? 'bg-[#ff5000]/10 border border-[#ff5000]/30' 
                          : notification.is_read 
                            ? 'bg-[#1a1a2e]/50' 
                            : 'bg-[#1a1a2e]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-sm leading-tight">{notification.title}</h4>
                            {notification.is_pinned && <Pin className="w-3 h-3 text-[#ff5000] flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{notification.message}</p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {new Date(notification.created_date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => togglePin(notification.id, notification.is_pinned)}
                          className={`text-xs px-2 py-1 rounded ${
                            notification.is_pinned 
                              ? 'bg-[#ff5000]/20 text-[#ff5000]' 
                              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {notification.event_id && (
                          <Link
                            to={createPageUrl('Calendar')}
                            onClick={() => setShowPanel(false)}
                            className="ml-auto text-xs text-[#ff5000] hover:text-[#cc4000]"
                          >
                            Ver no calendário
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {filteredNotifications.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma notificação</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}