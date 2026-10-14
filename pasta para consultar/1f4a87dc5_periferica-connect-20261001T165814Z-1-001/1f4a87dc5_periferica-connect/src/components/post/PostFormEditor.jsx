import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image as ImageIcon, Lock, CheckCircle } from 'lucide-react';
import { localApp } from '@/api/localClient';

// Preview components for different social networks
const InstagramPreview = ({ criacao }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-lg max-w-md mx-auto">
    {/* Header */}
    <div className="flex items-center gap-3 p-3 border-b">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
      <div className="flex-1">
        <p className="font-semibold text-sm text-black">Sua Empresa</p>
        <p className="text-xs text-gray-500">São Paulo, Brasil</p>
      </div>
    </div>

    {/* Image/Video */}
    <div className="aspect-square bg-gray-200 flex items-center justify-center">
      {criacao?.imagem_video ? (
        <img src={criacao.imagem_video} className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="w-16 h-16 text-gray-400" />
      )}
    </div>

    {/* Content */}
    <div className="p-3">
      <div className="flex gap-3 mb-3">
        <button className="hover:opacity-70">❤️</button>
        <button className="hover:opacity-70">💬</button>
        <button className="hover:opacity-70">✈️</button>
      </div>
      
      {criacao?.legenda && (
        <p className="text-sm text-black">
          <span className="font-semibold">sua_empresa</span>{' '}
          {criacao.legenda}
        </p>
      )}
      
      {criacao?.hashtags && (
        <p className="text-sm text-blue-500 mt-2">{criacao.hashtags}</p>
      )}
      
      <p className="text-xs text-gray-500 mt-2">há 5 minutos</p>
    </div>
  </div>
);

export default function PostFormEditor({ taskId, onSave }) {
  const [activeTab, setActiveTab] = useState('briefing');
  const [postForm, setPostForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPostForm();
  }, [taskId]);

  const loadPostForm = async () => {
    try {
      const forms = await localApp.entities.PostForm.filter({ task_id: taskId });
      if (forms.length > 0) {
        setPostForm(forms[0]);
      } else {
        // Create initial form
        const newForm = await localApp.entities.PostForm.create({
          task_id: taskId,
          briefing: {},
          criacao: {},
          historico: [],
          status_briefing: 'pendente',
          status_criacao: 'bloqueado'
        });
        setPostForm(newForm);
      }
    } catch (error) {
      console.log('Error loading post form:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBriefing = async (field, value) => {
    const updated = {
      ...postForm,
      briefing: { ...postForm.briefing, [field]: value }
    };
    await localApp.entities.PostForm.update(postForm.id, updated);
    setPostForm(updated);
  };

  const updateCriacao = async (field, value) => {
    const updated = {
      ...postForm,
      criacao: { ...postForm.criacao, [field]: value }
    };
    await localApp.entities.PostForm.update(postForm.id, updated);
    setPostForm(updated);
  };

  const handleCompleteBriefing = async () => {
    await localApp.entities.PostForm.update(postForm.id, {
      status_briefing: 'concluido',
      status_criacao: 'em_criacao'
    });
    setPostForm(prev => ({
      ...prev,
      status_briefing: 'concluido',
      status_criacao: 'em_criacao'
    }));
    setActiveTab('criacao');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { file_url } = await localApp.integrations.Core.UploadFile({ file });
    updateCriacao('imagem_video', file_url);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-[#ff5000] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-[#1a1a2e] w-full grid grid-cols-3">
        <TabsTrigger value="briefing" className="data-[state=active]:bg-[#ff5000]">
          Briefing {postForm?.status_briefing === 'concluido' && <CheckCircle className="w-4 h-4 ml-2" />}
        </TabsTrigger>
        <TabsTrigger 
          value="criacao" 
          disabled={postForm?.status_criacao === 'bloqueado'}
          className="data-[state=active]:bg-[#ff5000] disabled:opacity-50"
        >
          Criação {postForm?.status_criacao === 'bloqueado' && <Lock className="w-4 h-4 ml-2" />}
        </TabsTrigger>
        <TabsTrigger value="historico" className="data-[state=active]:bg-[#ff5000]">
          Histórico
        </TabsTrigger>
      </TabsList>

      {/* Briefing Tab */}
      <TabsContent value="briefing" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label>Objetivo do Conteúdo *</Label>
              <Textarea
                value={postForm?.briefing?.objetivo || ''}
                onChange={(e) => updateBriefing('objetivo', e.target.value)}
                placeholder="O que queremos alcançar com este post?"
                className="bg-[#1a1a2e] border-white/10 min-h-24"
              />
            </div>

            <div>
              <Label>Produto/Serviço *</Label>
              <Input
                value={postForm?.briefing?.produto_servico || ''}
                onChange={(e) => updateBriefing('produto_servico', e.target.value)}
                placeholder="Qual produto ou serviço será promovido?"
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>

            <div>
              <Label>Tom da Comunicação *</Label>
              <Select
                value={postForm?.briefing?.tom_comunicacao || ''}
                onValueChange={(v) => updateBriefing('tom_comunicacao', v)}
              >
                <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="informal">Informal</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="descontraido">Descontraído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Público-Alvo</Label>
              <Input
                value={postForm?.briefing?.publico_alvo || ''}
                onChange={(e) => updateBriefing('publico_alvo', e.target.value)}
                placeholder="Para quem é este conteúdo?"
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>

            <div>
              <Label>Ideias de Copy</Label>
              <Textarea
                value={postForm?.briefing?.ideias_copy || ''}
                onChange={(e) => updateBriefing('ideias_copy', e.target.value)}
                placeholder="Sugestões, frases-chave, abordagens..."
                className="bg-[#1a1a2e] border-white/10 min-h-32"
              />
            </div>

            {postForm?.status_briefing !== 'concluido' && (
              <Button onClick={handleCompleteBriefing} className="w-full gradient-primary">
                <CheckCircle className="w-4 h-4 mr-2" />
                Concluir Briefing e Liberar Criação
              </Button>
            )}
          </div>

          {/* Preview/References */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-4">Referências</h3>
            <p className="text-sm text-gray-400">
              Anexe imagens, links ou descrições de referências visuais para guiar a criação.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Criacao Tab */}
      <TabsContent value="criacao" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label>Canal *</Label>
              <Select
                value={postForm?.criacao?.canal || ''}
                onValueChange={(v) => updateCriacao('canal', v)}
              >
                <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Post *</Label>
              <Select
                value={postForm?.criacao?.tipo_post || ''}
                onValueChange={(v) => updateCriacao('tipo_post', v)}
              >
                <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="stories">Stories</SelectItem>
                  <SelectItem value="reels">Reels</SelectItem>
                  <SelectItem value="carrossel">Carrossel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Imagem/Vídeo *</Label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#ff5000]/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-400">Clique para fazer upload</p>
                </label>
              </div>
            </div>

            <div>
              <Label>Legenda *</Label>
              <Textarea
                value={postForm?.criacao?.legenda || ''}
                onChange={(e) => updateCriacao('legenda', e.target.value)}
                placeholder="Escreva a legenda do post..."
                className="bg-[#1a1a2e] border-white/10 min-h-32"
              />
            </div>

            <div>
              <Label>CTA (Chamada para Ação)</Label>
              <Input
                value={postForm?.criacao?.cta || ''}
                onChange={(e) => updateCriacao('cta', e.target.value)}
                placeholder="Ex: Saiba mais, Compre agora, Acesse o link"
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>

            <div>
              <Label>Hashtags</Label>
              <Input
                value={postForm?.criacao?.hashtags || ''}
                onChange={(e) => updateCriacao('hashtags', e.target.value)}
                placeholder="#exemplo #hashtags"
                className="bg-[#1a1a2e] border-white/10"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-4">Preview</h3>
            {postForm?.criacao?.canal === 'instagram' && (
              <InstagramPreview criacao={postForm.criacao} />
            )}
            {!postForm?.criacao?.canal && (
              <div className="text-center text-gray-500 py-12">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Selecione um canal para ver o preview</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Historico Tab */}
      <TabsContent value="historico">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold mb-4">Histórico de Alterações</h3>
          <div className="space-y-3">
            {postForm?.historico?.length > 0 ? (
              postForm.historico.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-[#1a1a2e]">
                  <p className="text-sm">{item.change_type}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.user_email} • {new Date(item.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhuma alteração registrada</p>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}