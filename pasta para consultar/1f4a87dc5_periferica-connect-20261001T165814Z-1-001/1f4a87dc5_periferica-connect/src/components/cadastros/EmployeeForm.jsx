import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { localApp } from '@/api/localClient';

export default function EmployeeForm({ employee, onSave, onClose, users }) {
  const [formData, setFormData] = useState({
    user_id: '',
    birth_date: '',
    department: 'gestao',
    position: '',
    phone: '',
    contract_type: 'clt',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    employee_status: 'ativo'
  });
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
      if (employee.user_id) {
        const user = users?.find(u => u.id === employee.user_id);
        setSelectedUser(user);
      }
    }
  }, [employee, users]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.user_id) {
      alert('Selecione um usuário para vincular');
      return;
    }
    
    if (!formData.position) {
      alert('Informe a função do funcionário');
      return;
    }
    
    // Mostrar confirmação
    setShowConfirmDialog(true);
  };

  const getDefaultPermissionsByPosition = (position) => {
    const positionLower = position.toLowerCase();
    
    // Copywriter / Redatora
    if (positionLower.includes('copy') || positionLower.includes('redator')) {
      return {
        papel: 'copy',
        permissions: {
          tarefas_visualizar_minhas: true,
          tarefas_avancar_etapas: true,
          eventos_visualizar: true,
          eventos_avancar: true,
          formularios_visualizar: true,
          formularios_preencher: true,
          formularios_editar: true,
          formularios_anexar_arquivos: true,
          chat_enviar_mensagens: true,
          chat_ler_mensagens: true,
          ponto_bater: true,
          ponto_visualizar_proprio: true,
          ponto_solicitar_ajuste: true,
        }
      };
    }
    
    // Designer
    if (positionLower.includes('design')) {
      return {
        papel: 'designer',
        permissions: {
          tarefas_visualizar_minhas: true,
          tarefas_avancar_etapas: true,
          eventos_visualizar: true,
          eventos_avancar: true,
          formularios_visualizar: true,
          formularios_preencher: true,
          formularios_editar: true,
          formularios_anexar_arquivos: true,
          chat_enviar_mensagens: true,
          chat_ler_mensagens: true,
          ponto_bater: true,
          ponto_visualizar_proprio: true,
          ponto_solicitar_ajuste: true,
        }
      };
    }
    
    // Video Maker
    if (positionLower.includes('video')) {
      return {
        papel: 'video_maker',
        permissions: {
          tarefas_visualizar_minhas: true,
          tarefas_avancar_etapas: true,
          eventos_visualizar: true,
          eventos_avancar: true,
          formularios_visualizar: true,
          formularios_anexar_arquivos: true,
          chat_enviar_mensagens: true,
          chat_ler_mensagens: true,
          ponto_bater: true,
          ponto_visualizar_proprio: true,
          ponto_solicitar_ajuste: true,
        }
      };
    }
    
    // Gestor / Gerente
    if (positionLower.includes('gestor') || positionLower.includes('gerente')) {
      return {
        papel: 'gestor_carteira',
        permissions: {
          cadastros_visualizar: true,
          cadastros_criar_clientes: true,
          cadastros_editar_clientes: true,
          tarefas_criar: true,
          tarefas_editar: true,
          tarefas_visualizar_todas: true,
          tarefas_alterar_responsaveis: true,
          tarefas_avancar_etapas: true,
          tarefas_voltar_etapas: true,
          tarefas_concluir: true,
          eventos_visualizar: true,
          eventos_avancar: true,
          eventos_retornar: true,
          formularios_visualizar: true,
          formularios_preencher: true,
          formularios_editar: true,
          ajustes_visualizar: true,
          ajustes_responder: true,
          publicacao_aprovar: true,
          publicacao_programar: true,
          chat_enviar_mensagens: true,
          chat_ler_mensagens: true,
          chat_criar_grupos: true,
          chat_adicionar_membros: true,
          ponto_bater: true,
          ponto_visualizar_proprio: true,
          ponto_solicitar_ajuste: true,
          ponto_visualizar_solicitacoes: true,
        }
      };
    }
    
    // Consultor (padrão)
    return {
      papel: 'consultor',
      permissions: {
        tarefas_visualizar_minhas: true,
        eventos_visualizar: true,
        formularios_visualizar: true,
        ajustes_solicitar: true,
        ajustes_visualizar: true,
        chat_enviar_mensagens: true,
        chat_ler_mensagens: true,
        ponto_bater: true,
        ponto_visualizar_proprio: true,
        ponto_solicitar_ajuste: true,
      }
    };
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    
    try {
      // Criar permissões automáticas baseadas na função
      const defaultPermissions = getDefaultPermissionsByPosition(formData.position);
      
      // Verificar se já existe permissão para este usuário
      const existingRoles = await localApp.entities.UserRole.filter({ user_email: selectedUser.email });
      
      if (existingRoles.length === 0) {
        await localApp.entities.UserRole.create({
          user_email: selectedUser.email,
          ...defaultPermissions,
          status: 'ativo'
        });
      }
      
      // Salvar funcionário
      onSave(formData);
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      alert('⚠️ Erro ao criar funcionário.');
    }
  };



  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">{employee ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div>
          <Label className="text-gray-400">Usuário *</Label>
          <select
            value={formData.user_id}
            onChange={(e) => {
              const userId = e.target.value;
              const user = users?.find(u => u.id === userId);
              setSelectedUser(user);
              setFormData(prev => ({ ...prev, user_id: userId }));
            }}
            className="w-full h-10 bg-[#1a1a2e] border border-white/10 rounded-md px-3 text-white"
            required
            disabled={!!employee}
          >
            <option value="">Selecione um usuário...</option>
            {users?.map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
          {employee && (
            <p className="text-xs text-gray-500 mt-1">Usuário não pode ser alterado após criação</p>
          )}
        </div>

        {selectedUser && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              📧 {selectedUser.email}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {selectedUser.role === 'admin' ? '👑 Administrador' : '👤 Usuário'}
            </p>
          </div>
        )}

        <div>
          <Label className="text-gray-400">Data de Nascimento *</Label>
          <Input
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400">Cargo *</Label>
            <Input
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10"
              required
            />
          </div>
          <div>
            <Label className="text-gray-400">Telefone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-[#1a1a2e] border-white/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-400">Departamento</Label>
            <Select value={formData.department} onValueChange={(v) => setFormData(prev => ({ ...prev, department: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="trafego">Tráfego</SelectItem>
                <SelectItem value="atendimento">Atendimento</SelectItem>
                <SelectItem value="gestao">Gestão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Tipo de Contrato</Label>
            <Select value={formData.contract_type} onValueChange={(v) => setFormData(prev => ({ ...prev, contract_type: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="clt">CLT</SelectItem>
                <SelectItem value="pj">PJ</SelectItem>
                <SelectItem value="estagio">Estágio</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Status</Label>
            <Select value={formData.employee_status} onValueChange={(v) => setFormData(prev => ({ ...prev, employee_status: v }))}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-gray-400">Carteira / Equipe</Label>
          <Select value={formData.carteira || ''} onValueChange={(v) => setFormData(prev => ({ ...prev, carteira: v }))}>
            <SelectTrigger className="bg-[#1a1a2e] border-white/10">
              <SelectValue placeholder="Selecione a carteira" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="c1">C1 - Carteira 1</SelectItem>
              <SelectItem value="c2">C2 - Carteira 2</SelectItem>
              <SelectItem value="c3">C3 - Carteira 3</SelectItem>
              <SelectItem value="c4">C4 - Carteira 4</SelectItem>
              <SelectItem value="gerencia">Gerência</SelectItem>
              <SelectItem value="videomaker">Video Maker</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-400">Data de Início</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            className="bg-[#1a1a2e] border-white/10"
          />
        </div>
      </form>

      <div className="flex gap-3 p-6 border-t border-white/10">
        <Button variant="outline" onClick={onClose} className="flex-1 border-white/10">
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit} className="flex-1 gradient-primary">
          Salvar
        </Button>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-[#12121a] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="w-6 h-6 text-[#ff5000]" />
              Confirmar Cadastro de Funcionário
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 space-y-3">
              <p>
                Você está vinculando <strong className="text-white">{selectedUser?.full_name}</strong> como funcionário.
              </p>
              
              <div className="p-3 bg-[#1a1a2e] rounded-lg space-y-2 text-sm">
                <p><strong className="text-white">Função:</strong> {formData.position}</p>
                <p><strong className="text-white">Departamento:</strong> {formData.department}</p>
              </div>

              <p className="text-xs text-blue-400">
                💡 As permissões serão aplicadas automaticamente baseadas na função selecionada.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="gradient-primary">
              Confirmar e Salvar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}