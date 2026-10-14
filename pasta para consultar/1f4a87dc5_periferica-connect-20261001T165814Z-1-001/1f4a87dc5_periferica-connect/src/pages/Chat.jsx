import React, { useState, useEffect, useRef } from 'react';
import { localApp } from '@/api/localClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Send, 
  Paperclip,
  Users,
  MoreVertical,
  Pin,
  Trash2,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadMessages(selectedGroup.id);
      
      // Real-time subscription
      const unsubscribe = localApp.entities.ChatMessage.subscribe((event) => {
        if (event.data.group_id === selectedGroup.id) {
          if (event.type === 'create') {
            setMessages(prev => [...prev, event.data]);
            scrollToBottom();
          } else if (event.type === 'update') {
            setMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
          } else if (event.type === 'delete') {
            setMessages(prev => prev.filter(m => m.id !== event.id));
          }
        }
      });

      return unsubscribe;
    }
  }, [selectedGroup]);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);

      // Load groups based on user role
      let userGroups = [];
      if (currentUser.role === 'admin') {
        // COO/Admin can see all groups
        userGroups = await localApp.entities.ChatGroup.filter({ status: 'ativo' });
      } else {
        // Regular users only see groups they're members of
        const allGroups = await localApp.entities.ChatGroup.filter({ status: 'ativo' });
        userGroups = allGroups.filter(g => g.members?.includes(currentUser.email));
      }

      setGroups(userGroups);
      if (userGroups.length > 0) {
        setSelectedGroup(userGroups[0]);
      }

      // Load all users (for admin)
      if (currentUser.role === 'admin') {
        const users = await localApp.entities.User.list();
        setAllUsers(users);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (groupId) => {
    const msgs = await localApp.entities.ChatMessage.filter({ group_id: groupId, deleted_at: null }, '-created_date');
    setMessages(msgs.reverse());
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedGroup) return;

    const newMessage = await localApp.entities.ChatMessage.create({
      group_id: selectedGroup.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: messageInput,
      message_type: 'text'
    });

    await localApp.entities.ChatGroup.update(selectedGroup.id, {
      last_message_at: new Date().toISOString()
    });

    setMessageInput('');
  };

  const canCreateGroups = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] flex gap-4">
      {/* Groups Sidebar */}
      <div className="w-80 glass-card rounded-2xl flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Grupos</h2>
            {canCreateGroups && (
              <Button size="icon" onClick={() => setShowNewGroupModal(true)} className="gradient-primary">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Input
            placeholder="Buscar grupos..."
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedGroup(group)}
              className={`p-3 rounded-xl cursor-pointer transition-all mb-2 ${
                selectedGroup?.id === group.id
                  ? 'bg-[#ff5000] text-white'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedGroup?.id === group.id ? 'bg-white/20' : 'bg-[#ff5000]/20'
                }`}>
                  <Users className={`w-6 h-6 ${
                    selectedGroup?.id === group.id ? 'text-white' : 'text-[#ff5000]'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{group.name}</p>
                  <p className={`text-xs truncate ${
                    selectedGroup?.id === group.id ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {group.members?.length || 0} membros
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedGroup ? (
        <div className="flex-1 glass-card rounded-2xl flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">{selectedGroup.name}</h3>
              <p className="text-sm text-gray-400">{selectedGroup.members?.length || 0} membros</p>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Button 
                  size="sm" 
                  onClick={() => setShowAddMembersModal(true)}
                  className="gradient-primary"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Adicionar Membros
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_email === user?.email;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwn && (
                      <span className="text-xs text-gray-400 mb-1">{message.sender_name}</span>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'gradient-primary text-white'
                          : 'bg-[#1a1a2e] text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <span className={`text-xs mt-1 block ${
                        isOwn ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {format(new Date(message.created_date), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="icon">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-[#1a1a2e] border-white/10"
              />
              <Button type="submit" className="gradient-primary">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 glass-card rounded-2xl flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Selecione um grupo para começar</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showNewGroupModal && (
          <NewGroupModal
            onClose={() => setShowNewGroupModal(false)}
            onSave={async (groupData) => {
              const newGroup = await localApp.entities.ChatGroup.create({
                ...groupData,
                owner_email: user.email,
                members: [user.email, ...(groupData.members || [])]
              });
              setGroups(prev => [...prev, newGroup]);
              setShowNewGroupModal(false);
            }}
          />
        )}

        {showAddMembersModal && selectedGroup && (
          <AddMembersModal
            group={selectedGroup}
            allUsers={allUsers}
            onClose={() => setShowAddMembersModal(false)}
            onSave={async (newMembers) => {
              const updatedMembers = [...(selectedGroup.members || []), ...newMembers];
              await localApp.entities.ChatGroup.update(selectedGroup.id, {
                members: updatedMembers
              });
              
              // Send system message
              await localApp.entities.ChatMessage.create({
                group_id: selectedGroup.id,
                sender_email: 'system',
                sender_name: 'Sistema',
                content: `${newMembers.join(', ')} foi(ram) adicionado(s) ao grupo por ${user.full_name}`,
                message_type: 'text'
              });

              setSelectedGroup(prev => ({ ...prev, members: updatedMembers }));
              setGroups(prev => prev.map(g => 
                g.id === selectedGroup.id ? { ...g, members: updatedMembers } : g
              ));
              setShowAddMembersModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewGroupModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'carteira',
    description: '',
    members: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-[#12121a] rounded-2xl w-full max-w-md border border-[#ff5000]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Novo Grupo</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Nome do Grupo *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: C1 - Carteira Christina"
              className="bg-[#1a1a2e] border-white/10"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full h-9 bg-[#1a1a2e] border border-white/10 rounded-md px-3 text-white"
            >
              <option value="carteira">Carteira</option>
              <option value="squad">Squad</option>
              <option value="projeto">Projeto</option>
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10"
            />
          </div>
        </form>

        <div className="flex gap-3 p-6 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1 gradient-primary">
            Criar Grupo
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AddMembersModal({ group, allUsers, onClose, onSave }) {
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Filter out users already in the group
  const availableUsers = allUsers.filter(u => 
    !group.members?.includes(u.email) && u.email !== 'system'
  );

  const toggleUser = (email) => {
    setSelectedUsers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSubmit = () => {
    if (selectedUsers.length > 0) {
      onSave(selectedUsers);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-[#12121a] rounded-2xl w-full max-w-md border border-[#ff5000]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Adicionar Membros</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {availableUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Não há usuários disponíveis para adicionar</p>
          ) : (
            availableUsers.map(user => (
              <div
                key={user.email}
                onClick={() => toggleUser(user.email)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  selectedUsers.includes(user.email)
                    ? 'bg-[#ff5000]/20 border-2 border-[#ff5000]'
                    : 'bg-[#1a1a2e] hover:bg-[#1a1a2e]/80 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="font-bold">{user.full_name?.charAt(0) || 'U'}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  {selectedUsers.includes(user.email) && (
                    <div className="w-6 h-6 rounded-full bg-[#ff5000] flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-white/10">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-[#ff5000] border-[#ff5000] text-white hover:bg-[#cc4000]">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedUsers.length === 0}
            className="flex-1 gradient-primary disabled:opacity-50"
          >
            Adicionar ({selectedUsers.length})
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}