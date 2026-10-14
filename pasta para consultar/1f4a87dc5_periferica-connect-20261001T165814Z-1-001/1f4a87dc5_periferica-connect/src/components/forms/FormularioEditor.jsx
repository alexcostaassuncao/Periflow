import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import PreviewFormulario from './PreviewFormulario';

export default function FormularioEditor({ formulario, onSave, onClose, task, onUpdateTask }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('briefing');
  const [briefing, setBriefing] = useState(formulario?.briefing || {});
  const [criacao, setCriacao] = useState(formulario?.criacao || {});
  const [design, setDesign] = useState(formulario?.design || {});
  const [isEditing, setIsEditing] = useState(!formulario?.id);

  // Determinar qual aba abrir baseado no papel do usuário e status do formulário
  useEffect(() => {
    if (user && formulario) {
      const currentEvent = task?.events?.[task?.current_event_index || 0];
      
      if (currentEvent?.event_type === 'copy' || currentEvent?.event_type === 'redacao') {
        setActiveTab('criacao');
      } else if (currentEvent?.event_type === 'design') {
        setActiveTab('design');
      } else if (currentEvent?.event_type === 'aprovacao') {
        setActiveTab('visualizar');
      } else {
        setActiveTab('briefing');
      }
    }
  }, [user, formulario, task]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await localApp.auth.me();
    setUser(currentUser);
    
    const employees = await localApp.entities.Employee.filter({ user_id: currentUser.id });
    if (employees.length > 0) {
      setEmployee(employees[0]);
    }
  };

  const handleFileUpload = async (e, field, section) => {
    const files = Array.from(e.target.files);
    const uploads = await Promise.all(
      files.map(file => localApp.integrations.Core.UploadFile({ file }))
    );
    
    const fileUrls = uploads.map(u => u.file_url);
    
    if (section === 'briefing') {
      setBriefing(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), ...fileUrls]
      }));
    } else if (section === 'criacao') {
      setCriacao(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), ...fileUrls]
      }));
    } else if (section === 'design') {
      setDesign(prev => ({
        ...prev,
        [field]: fileUrls[0]
      }));
    }
  };

  const handleSave = async () => {
    const historico = formulario?.historico || [];
    const changes = [];

    // Track changes
    Object.keys(briefing).forEach(key => {
      if (JSON.stringify(briefing[key]) !== JSON.stringify(formulario?.briefing?.[key])) {
        changes.push({
          timestamp: new Date().toISOString(),
          user_email: user?.email,
          change_type: 'briefing',
          campo: key,
          old_value: formulario?.briefing?.[key] ? JSON.stringify(formulario.briefing[key]) : '',
          new_value: briefing[key] ? JSON.stringify(briefing[key]) : ''
        });
      }
    });

    Object.keys(criacao).forEach(key => {
      if (JSON.stringify(criacao[key]) !== JSON.stringify(formulario?.criacao?.[key])) {
        changes.push({
          timestamp: new Date().toISOString(),
          user_email: user?.email,
          change_type: 'criacao',
          campo: key,
          old_value: formulario?.criacao?.[key] ? JSON.stringify(formulario.criacao[key]) : '',
          new_value: criacao[key] ? JSON.stringify(criacao[key]) : ''
        });
      }
    });

    const updatedFormulario = {
      ...formulario,
      briefing,
      criacao,
      design,
      historico: [...historico, ...changes],
      status: determineStatus()
    };

    await onSave(updatedFormulario);
    setIsEditing(false);
  };

  const determineStatus = () => {
    const briefingCompleto = briefing.objetivo && briefing.plataformas?.length > 0;
    const copyCompleta = criacao.direcionamento_criativo;
    const designCompleto = design.arte_final;
    
    if (designCompleto) return 'design_completo';
    if (copyCompleta) return 'copy_completo';
    if (briefingCompleto) return 'briefing_completo';
    return 'rascunho';
  };

  const handleAvancaBriefing = async () => {
    const updatedFormulario = {
      ...formulario,
      briefing,
      criacao,
      design,
      status: 'briefing_completo'
    };
    await onSave(updatedFormulario);
    
    // Avançar para o próximo evento (redação/copy)
    if (onUpdateTask && task) {
      await onUpdateTask(task.id, { current_event_index: (task.current_event_index || 0) + 1 });
    }
    
    alert('✅ Briefing encaminhado para a Copy!');
  };

  const handleAvancaCopy = async () => {
    const updatedFormulario = {
      ...formulario,
      briefing,
      criacao,
      design,
      status: 'copy_completo'
    };
    await onSave(updatedFormulario);
    
    // Avançar para o próximo evento (design)
    if (onUpdateTask && task) {
      await onUpdateTask(task.id, { current_event_index: (task.current_event_index || 0) + 1 });
    }
    
    alert('✅ Direcionamento encaminhado para o Designer!');
  };

  const handleAvancaDesign = async () => {
    const updatedFormulario = {
      ...formulario,
      briefing,
      criacao,
      design,
      status: 'design_completo'
    };
    await onSave(updatedFormulario);
    
    // Avançar para aprovação
    if (onUpdateTask && task) {
      await onUpdateTask(task.id, { current_event_index: (task.current_event_index || 0) + 1 });
    }
    
    alert('✅ Arte enviada para Aprovação do Cliente!');
  };

  const handleSendToApproval = async () => {
    const hasAdjustments = window.confirm('Essa tarefa precisa de ajustes?');
    
    if (hasAdjustments) {
      alert('⚠️ Tarefa voltou para Design para ajustes');
    } else {
      const createPublication = window.confirm('✅ Aprovado! Deseja criar publicação agora?');
      if (createPublication) {
        alert('Redirecionando para criar publicação...');
      }
    }
  };

  const handlePlatformToggle = (platform) => {
    const current = briefing.plataformas || [];
    const updated = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform];
    setBriefing(prev => ({ ...prev, plataformas: updated }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a1a2e] w-full grid grid-cols-5">
            <TabsTrigger value="briefing" className="data-[state=active]:bg-[#ff5000]">
              Briefing
            </TabsTrigger>
            <TabsTrigger value="criacao" className="data-[state=active]:bg-[#ff5000]">
              Copy
            </TabsTrigger>
            <TabsTrigger value="design" className="data-[state=active]:bg-[#ff5000]">
              Design
            </TabsTrigger>
            <TabsTrigger value="visualizar" className="data-[state=active]:bg-[#ff5000]">
              Visualizar
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-[#ff5000]">
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Briefing */}
          <TabsContent value="briefing" className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Objetivo do Conteúdo *</Label>
              <Textarea
                value={briefing.objetivo || ''}
                onChange={(e) => setBriefing(prev => ({ ...prev, objetivo: e.target.value }))}
                placeholder="Qual o objetivo deste conteúdo?"
                className="bg-[#1a1a2e] border-white/10 min-h-24"
                readOnly={!isEditing}
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Plataformas *</Label>
              <div className="space-y-2">
                {['Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'TikTok'].map(platform => (
                  <div key={platform} className="flex items-center gap-3">
                    <Checkbox
                      checked={briefing.plataformas?.includes(platform)}
                      onCheckedChange={() => isEditing && handlePlatformToggle(platform)}
                      disabled={!isEditing}
                    />
                    <Label className="text-white">{platform}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Referências e Links</Label>
              <Textarea
                value={briefing.referencias || ''}
                onChange={(e) => setBriefing(prev => ({ ...prev, referencias: e.target.value }))}
                placeholder="Cole aqui links e referências..."
                className="bg-[#1a1a2e] border-white/10"
                readOnly={!isEditing}
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Anexos</Label>
              {isEditing ? (
                <>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'anexos', 'briefing')}
                    className="hidden"
                    id="briefing-files"
                  />
                  <label htmlFor="briefing-files">
                    <Button type="button" variant="outline" className="border-white/10" asChild>
                      <span><Upload className="w-4 h-4 mr-2" /> Anexar Arquivos</span>
                    </Button>
                  </label>
                </>
              ) : null}
              {briefing.anexos?.length > 0 && (
                <p className="text-sm text-gray-400 mt-2">{briefing.anexos.length} arquivo(s)</p>
              )}
            </div>
          </TabsContent>

          {/* Copy */}
          <TabsContent value="criacao" className="space-y-4 mt-4">
            {/* Visualização do Briefing */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
              <h4 className="font-semibold mb-2 text-[#ff5000]">📋 Briefing (Visualização)</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Objetivo:</span> {briefing.objetivo || '-'}</p>
                <p><span className="text-gray-400">Plataformas:</span> {briefing.plataformas?.join(', ') || '-'}</p>
                {briefing.referencias && (
                  <p><span className="text-gray-400">Referências:</span> {briefing.referencias}</p>
                )}
                {briefing.anexos?.length > 0 && (
                  <p className="text-gray-400">{briefing.anexos.length} arquivo(s) anexado(s)</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Direcionamento Criativo (Copy) *</Label>
              <Textarea
                value={criacao.direcionamento_criativo || ''}
                onChange={(e) => setCriacao(prev => ({ ...prev, direcionamento_criativo: e.target.value }))}
                placeholder="Ideia do post/vídeo, linha criativa, sugestão de abordagem..."
                className="bg-[#1a1a2e] border-white/10 min-h-32"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Anexos Criativos</Label>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e, 'anexos_criacao', 'criacao')}
                className="hidden"
                id="criacao-files"
              />
              <label htmlFor="criacao-files">
                <Button type="button" variant="outline" className="border-white/10" asChild>
                  <span><Upload className="w-4 h-4 mr-2" /> Anexar Arquivos</span>
                </Button>
              </label>
              {criacao.anexos_criacao?.length > 0 && (
                <p className="text-sm text-gray-400 mt-2">{criacao.anexos_criacao.length} arquivo(s)</p>
              )}
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Legenda do Post</Label>
              <Textarea
                value={criacao.legenda_post || ''}
                onChange={(e) => setCriacao(prev => ({ ...prev, legenda_post: e.target.value }))}
                placeholder="Texto final que será publicado..."
                className="bg-[#1a1a2e] border-white/10 min-h-32"
              />
            </div>
          </TabsContent>

          {/* Design */}
          <TabsContent value="design" className="space-y-4 mt-4">
            {/* Visualização do Direcionamento da Copy */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
              <h4 className="font-semibold mb-2 text-[#ff5000]">✍️ Direcionamento da Copy (Visualização)</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Direcionamento Criativo:</p>
                  <Textarea
                    value={criacao.direcionamento_criativo || '-'}
                    readOnly
                    className="bg-[#1a1a2e] border-white/10 text-white text-sm min-h-20"
                  />
                </div>
                {criacao.legenda_post && (
                  <div>
                    <p className="text-gray-400 mb-1">Legenda:</p>
                    <Textarea
                      value={criacao.legenda_post}
                      readOnly
                      className="bg-[#1a1a2e] border-white/10 text-white text-sm min-h-24"
                    />
                  </div>
                )}
                {criacao.anexos_criacao?.length > 0 && (
                  <p className="text-gray-400">{criacao.anexos_criacao.length} arquivo(s) de referência</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Anexos Criativos (Arte Final) *</Label>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFileUpload(e, 'anexos_criacao', 'criacao')}
                className="hidden"
                id="design-arte"
              />
              <label htmlFor="design-arte">
                <Button type="button" variant="outline" className="border-white/10" asChild>
                  <span><ImageIcon className="w-4 h-4 mr-2" /> Anexar Arte Final</span>
                </Button>
              </label>
              {criacao.anexos_criacao?.length > 0 && (
                <p className="text-sm text-gray-400 mt-2">{criacao.anexos_criacao.length} arquivo(s)</p>
              )}
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Observações Técnicas</Label>
              <Textarea
                value={design.observacoes || ''}
                onChange={(e) => setDesign(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Informações técnicas sobre a arte..."
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>
          </TabsContent>

          {/* Visualizar */}
          <TabsContent value="visualizar" className="mt-4">
            <div className="glass-card rounded-2xl p-6">
              <PreviewFormulario
                tipo={formulario?.tipo}
                briefing={briefing}
                criacao={criacao}
              />
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico" className="space-y-3 mt-4">
            {formulario?.historico?.length > 0 ? (
              formulario.historico.map((entry, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#1a1a2e]">
                  <p className="text-sm font-medium">{entry.campo}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {entry.user_email} • {new Date(entry.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhuma alteração registrada</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/10">
            Cancelar
          </Button>
          
          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1 border-[#ff5000] text-[#ff5000]">
                Editar
              </Button>
              <Button onClick={onClose} className="flex-1 gradient-primary">
                Visualizar
              </Button>
            </>
          ) : (
            <Button onClick={handleSave} className="flex-1 gradient-primary">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          )}

          {/* Botão Avançar Workflow - Gestor completou briefing */}
          {formulario?.status === 'briefing_completo' && activeTab === 'briefing' && (
            <Button onClick={handleAvancaBriefing} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Encaminhar para Copy →
            </Button>
          )}

          {/* Botão Avançar Workflow - Copy completou direcionamento */}
          {(formulario?.status === 'briefing_completo' || formulario?.status === 'copy_completo') && 
           activeTab === 'criacao' && criacao.direcionamento_criativo && (
            <Button onClick={handleAvancaCopy} className="flex-1 bg-purple-600 hover:bg-purple-700">
              Encaminhar para Design →
            </Button>
          )}

          {/* Botão Avançar Workflow - Designer completou arte */}
          {(formulario?.status === 'copy_completo' || formulario?.status === 'design_completo') && 
           activeTab === 'design' && criacao.anexos_criacao?.length > 0 && (
            <Button onClick={handleAvancaDesign} className="flex-1 bg-green-600 hover:bg-green-700">
              Enviar para Aprovação →
            </Button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold mb-4">Preview</h3>
        <PreviewFormulario
          tipo={formulario?.tipo}
          briefing={briefing}
          criacao={criacao}
        />
      </div>
    </div>
  );
}