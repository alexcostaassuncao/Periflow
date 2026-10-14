import React from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

export default function PreviewFormulario({ tipo, briefing, criacao }) {
  const renderInstagramPreview = () => (
    <div className="bg-white rounded-lg overflow-hidden max-w-md mx-auto shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
        <div>
          <p className="font-semibold text-sm text-black">Cliente</p>
          <p className="text-xs text-gray-500">Patrocinado</p>
        </div>
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {criacao?.arte_final ? (
          <img src={criacao.arte_final} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <p className="text-gray-400">Sua arte aparecerá aqui</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-4 mb-3">
          <Heart className="w-6 h-6 text-black" />
          <MessageCircle className="w-6 h-6 text-black" />
          <Send className="w-6 h-6 text-black" />
          <Bookmark className="w-6 h-6 text-black ml-auto" />
        </div>
        <p className="font-semibold text-sm text-black mb-1">1.234 curtidas</p>
        {criacao?.legenda_post && (
          <p className="text-sm text-black">
            <span className="font-semibold">cliente </span>
            {criacao.legenda_post}
          </p>
        )}
      </div>
    </div>
  );

  const renderBannerPreview = () => (
    <div className="bg-gray-100 rounded-lg p-8">
      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        {criacao?.arte_final ? (
          <img src={criacao.arte_final} alt="Banner" className="w-full h-auto" />
        ) : (
          <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center">
            <p className="text-gray-400">Banner aparecerá aqui</p>
          </div>
        )}
        {criacao?.texto_banner && (
          <div className="p-4">
            <p className="text-gray-700">{criacao.texto_banner}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderYouTubePreview = () => (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {criacao?.arte_final ? (
        <img src={criacao.arte_final} alt="YouTube" className="w-full aspect-video object-cover" />
      ) : (
        <div className="aspect-video bg-gray-800 flex items-center justify-center">
          <p className="text-gray-500">Capa YouTube aparecerá aqui</p>
        </div>
      )}
    </div>
  );

  const renderDefault = () => (
    <div className="bg-[#1a1a2e] rounded-lg p-8 text-center">
      <p className="text-gray-400">Preview não disponível para este tipo de conteúdo</p>
      {criacao?.arte_final && (
        <img src={criacao.arte_final} alt="Preview" className="mt-4 rounded-lg max-h-64 mx-auto" />
      )}
    </div>
  );

  switch (tipo) {
    case 'feed':
    case 'stories':
    case 'reels':
    case 'carrossel':
      return renderInstagramPreview();
    case 'banner_site':
      return renderBannerPreview();
    case 'capa_youtube':
    case 'banner_youtube':
      return renderYouTubePreview();
    default:
      return renderDefault();
  }
}