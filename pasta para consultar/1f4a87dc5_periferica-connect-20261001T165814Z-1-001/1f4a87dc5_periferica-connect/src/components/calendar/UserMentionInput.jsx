import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { Search, X, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMentionInput({ selectedUsers, onChange, label = "Mencionar Participantes" }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await localApp.entities.User.list();
    setUsers(allUsers);
  };

  const filteredUsers = users.filter(user => 
    !selectedUsers.includes(user.email) &&
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addUser = (email) => {
    onChange([...selectedUsers, email]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeUser = (email) => {
    onChange(selectedUsers.filter(e => e !== email));
  };

  const getUser = (email) => users.find(u => u.email === email);

  return (
    <div>
      <label className="text-gray-400 text-sm mb-2 block">{label}</label>
      
      <div className="space-y-2">
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(email => {
              const user = getUser(email);
              return (
                <div
                  key={email}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#ff5000]/20 border border-[#ff5000]/30 rounded-lg text-sm"
                >
                  <AtSign className="w-3 h-3 text-[#ff5000]" />
                  <span className="text-white">{user?.full_name || email}</span>
                  <button
                    onClick={() => removeUser(email)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar usuários..."
              className="w-full h-10 bg-[#1a1a2e] border border-white/10 rounded-md pl-10 pr-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/50"
            />
          </div>

          <AnimatePresence>
            {showDropdown && searchQuery && filteredUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
              >
                {filteredUsers.slice(0, 10).map(user => (
                  <button
                    key={user.email}
                    onClick={() => addUser(user.email)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#ff5000]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#ff5000]">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.full_name || user.email}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}