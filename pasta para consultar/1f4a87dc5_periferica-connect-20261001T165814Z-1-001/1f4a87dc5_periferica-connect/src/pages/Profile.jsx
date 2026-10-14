import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase,
  Camera,
  Save,
  Trophy,
  Zap,
  Clock,
  CheckCircle,
  Edit2,
  Palette
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ThemeCustomizer from '@/components/profile/ThemeCustomizer';

const departments = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'design', label: 'Design' },
  { value: 'trafego', label: 'Tráfego' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'gestao', label: 'Gestão' }
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil');
  const [formData, setFormData] = useState({
    phone: '',
    department: 'gestao',
    position: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await localApp.auth.me();
      setUser(currentUser);

      const employees = await localApp.entities.Employee.filter({ user_id: currentUser.id });
      if (employees.length > 0) {
        setEmployee(employees[0]);
        setFormData({
          phone: employees[0].phone || '',
          department: employees[0].department || 'gestao',
          position: employees[0].position || ''
        });
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await localApp.entities.Employee.update(employee.id, formData);
      setEmployee(prev => ({ ...prev, ...formData }));
      setEditing(false);
    } catch (error) {
      console.log('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await localApp.integrations.Core.UploadFile({ file });
      await localApp.entities.Employee.update(employee.id, { avatar_url: file_url });
      setEmployee(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.log('Error uploading avatar:', error);
    }
  };

  const getLevelTitle = (level) => {
    if (level <= 5) return 'Iniciante';
    if (level <= 10) return 'Explorador';
    if (level <= 20) return 'Profissional';
    if (level <= 35) return 'Expert';
    if (level <= 50) return 'Mestre';
    return 'Lenda';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Meu Perfil</h1>
        <p className="text-gray-400 mt-1">Gerencie suas informações e preferências</p>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#1a1a2e] w-fit">
        {[
          { key: 'perfil',         label: 'Perfil',          icon: User    },
          { key: 'personalizacao', label: 'Personalização',  icon: Palette },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'gradient-primary text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Personalização Tab */}
      {activeTab === 'personalizacao' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-bold mb-1">Personalização Visual</h3>
          <p className="text-sm text-gray-400 mb-6">As alterações são salvas apenas para você.</p>
          <ThemeCustomizer />
        </motion.div>
      )}

      {/* Profile Tab */}
      {activeTab === 'perfil' && <>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-col items-center text-center mb-6">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-2xl gradient-primary flex items-center justify-center glow-primary overflow-hidden">
              {employee?.avatar_url ? (
                <img src={employee.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#1a1a2e] border-2 border-[#ff5000] flex items-center justify-center cursor-pointer hover:bg-[#ff5000]/20 transition-all">
              <Camera className="w-5 h-5 text-[#ff5000]" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <h2 className="text-xl font-bold">{user?.full_name || 'Usuário'}</h2>
          <p className="text-gray-400">{employee?.position || 'Colaborador'}</p>

          {/* Level Badge */}
          <div className="mt-4 px-4 py-2 rounded-xl bg-[#ff5000]/10 border border-[#ff5000]/30">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#ff5000]" />
              <span className="font-bold">Nível {employee?.current_level || 1}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">{getLevelTitle(employee?.current_level || 1)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-xl bg-[#1a1a2e]">
            <Zap className="w-6 h-6 text-[#ff5000] mx-auto mb-2" />
            <p className="text-lg font-bold">{(employee?.xp_total || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">XP Total</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[#1a1a2e]">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-lg font-bold">{employee?.tasks_completed || 0}</p>
            <p className="text-xs text-gray-500">Tarefas</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[#1a1a2e]">
            <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-lg font-bold">{Math.floor((employee?.accumulated_minutes || 0) / 60)}h</p>
            <p className="text-xs text-gray-500">Folga</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Informações Pessoais</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setEditing(!editing)}
              className="hover:bg-white/10"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {editing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>

          <div className="space-y-4 p-4 rounded-xl bg-[#1a1a2e]">
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">E-mail</p>
                <p className="font-medium">{user?.email || '-'}</p>
              </div>
            </div>

            {editing ? (
              <>
                <div className="flex items-start gap-4">
                  <Phone className="w-5 h-5 text-gray-400 mt-2" />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">Telefone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      className="bg-[#12121a] border-white/10 mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Building className="w-5 h-5 text-gray-400 mt-2" />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">Departamento</Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, department: v }))}
                    >
                      <SelectTrigger className="bg-[#12121a] border-white/10 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        {departments.map(dept => (
                          <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-2" />
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500">Cargo</Label>
                    <Input
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Seu cargo"
                      className="bg-[#12121a] border-white/10 mt-1"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary mt-4">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="font-medium">{employee?.phone || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Departamento</p>
                    <p className="font-medium">
                      {departments.find(d => d.value === employee?.department)?.label || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Cargo</p>
                    <p className="font-medium">{employee?.position || '-'}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-bold mb-4">Progresso do Nível</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Nível {employee?.current_level || 1}</span>
            <span className="text-[#ff5000]">
              {(employee?.xp_total || 0) % 1000} / 1000 XP
            </span>
          </div>
          <div className="h-4 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((employee?.xp_total || 0) % 1000) / 10}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Faltam {1000 - ((employee?.xp_total || 0) % 1000)} XP para o próximo nível
          </p>
        </div>
      </motion.div>

      </>}
    </div>
  );
}