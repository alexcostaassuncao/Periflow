import React, { useState, useEffect } from 'react';
import { localApp } from '@/api/localClient';
import { Instagram, Facebook, Linkedin, Youtube, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MonitoramentoTab({ taskId }) {
  const [publications, setPublications] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublications();
  }, [taskId]);

  const loadPublications = async () => {
    try {
      const pubs = await localApp.entities.Publication.filter({ task_id: taskId });
      setPublications(pubs);
    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
    } finally {
      setLoading(false);
    }
  };

  const platformIcons = {
    instagram: <Instagram className="w-5 h-5" />,
    facebook: <Facebook className="w-5 h-5" />,
    linkedin: <Linkedin className="w-5 h-5" />,
    youtube: <Youtube className="w-5 h-5" />
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Carregando...</div>;
  }

  if (publications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Nenhuma publicação encontrada para esta tarefa</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Monitoramento de Publicações</h3>

      <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
        <TabsList className="bg-[#1a1a2e]">
          {publications.flatMap(pub => pub.channels).map(channel => (
            <TabsTrigger key={channel.platform} value={channel.platform} className="data-[state=active]:bg-[#ff5000]">
              {platformIcons[channel.platform]}
              <span className="ml-2 capitalize">{channel.platform}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {publications.map(pub => 
          pub.channels.filter(ch => ch.platform === selectedPlatform).map(channel => (
            <TabsContent key={channel.platform} value={channel.platform} className="space-y-4">
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-lg font-bold capitalize">{channel.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Publicado em</p>
                    <p className="text-lg font-bold">
                      {channel.published_at ? new Date(channel.published_at).toLocaleString('pt-BR') : 'Agendado'}
                    </p>
                  </div>
                </div>

                {channel.platform_post_id && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`https://${channel.platform}.com/p/${channel.platform_post_id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Publicação
                    </a>
                  </Button>
                )}

                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">⚠️ Apenas visualização</p>
                  <p className="text-xs text-gray-500">
                    Este é um acompanhamento do post publicado. Para editar, acesse diretamente a plataforma.
                  </p>
                </div>
              </div>
            </TabsContent>
          ))
        )}
      </Tabs>
    </div>
  );
}