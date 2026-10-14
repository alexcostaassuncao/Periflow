import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { localApp } from '@/api/localClient';

export default function UserView({ user, onClose }) {
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployee();
  }, [user]);

  const loadEmployee = async () => {
    try {
      const employees = await localApp.entities.Employee.filter({ user_id: user.id });
      if (employees.length > 0) {
        setEmployee(employees[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gerar username e senha baseado nos dados
  const generateUsername = () => {
    if (!user.full_name) return user.email?.split('@')[0] || '-';
    const nomes = user.full_name.toLowerCase().split(' ').filter(n => n.length > 0);
    return nomes.length >= 2 ? `${nomes[0]}${nomes[1]}` : nomes[0];
  };

  const generatePassword = () => {
    if (!employee?.birth_date) return 'N/A';
    
    // A senha é a data de nascimento no formato DDMMAA
    const date = new Date(employee.birth_date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    return `${day}${month}${year}`;
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const username = generateUsername();
  const password = generatePassword();

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">Visualizar Usuário</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Carregando...</div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 text-sm">Nome Completo</Label>
                <p className="text-white font-medium mt-1">{user.full_name || '-'}</p>
              </div>

              <div>
                <Label className="text-gray-400 text-sm">Email</Label>
                <p className="text-white font-medium mt-1">{user.email}</p>
              </div>

              <div>
                <Label className="text-gray-400 text-sm">Tipo de Usuário</Label>
                <p className="text-white font-medium mt-1">
                  {user.role === 'admin' ? '👑 Administrador' : '👤 Usuário'}
                </p>
              </div>
            </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="font-semibold mb-4 text-[#ff5000]">🔐 Credenciais de Acesso</h3>
          
          <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <div>
              <Label className="text-gray-400 text-xs">Username</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 rounded bg-[#1a1a2e] text-[#ff5000] font-mono">
                  {username}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(username, 'username')}
                  className="hover:bg-white/10"
                >
                  {copiedField === 'username' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-gray-400 text-xs">Senha</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 rounded bg-[#1a1a2e] text-[#ff5000] font-mono">
                  {showPassword ? password : '••••••'}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:bg-white/10"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(password, 'password')}
                  className="hover:bg-white/10"
                >
                  {copiedField === 'password' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 italic mt-3">
            💡 A senha padrão é baseada na data de nascimento (DDMMAA)
          </p>
        </div>
          </>
        )}
      </div>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button onClick={onClose} className="flex-1 gradient-primary">
          Fechar
        </Button>
      </div>
    </>
  );
}