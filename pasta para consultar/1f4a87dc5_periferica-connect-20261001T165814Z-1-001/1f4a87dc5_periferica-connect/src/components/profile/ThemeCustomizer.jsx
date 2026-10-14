import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Check, Image, Palette, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme, THEMES } from '@/lib/ThemeContext';
import { localApp } from '@/api/localClient';

const PRESET_COLORS = [
  '#ff5000','#ef4444','#f97316','#eab308',
  '#22c55e','#14b8a6','#3b82f6','#6366f1',
  '#a855f7','#ec4899','#ffffff','#94a3b8',
];

export default function ThemeCustomizer() {
  const { prefs, savePrefs, previewPrefs, resetPreview } = useTheme();
  const [local, setLocal] = useState({ ...prefs });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = (key, value) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    previewPrefs(next);
  };

  const handleSave = async () => {
    setSaving(true);
    await savePrefs(local);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetPreview();
    setLocal({ ...prefs });
  };

  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await localApp.integrations.Core.UploadFile({ file });
    update('bgImage', file_url);
    setUploading(false);
  };

  return (
    <div className="space-y-6">

      {/* ── Tema base ── */}
      <Section title="🎨 Tema Base">
        <div className="flex gap-3">
          {['dark', 'light'].map(mode => (
            <button
              key={mode}
              onClick={() => update('bgMode', mode)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                local.bgMode === mode
                  ? 'border-[var(--theme-primary,#ff5000)] bg-[var(--theme-primary,#ff5000)]/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {mode === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Cor principal ── */}
      <Section title="🖌️ Cor Principal">
        <div className="space-y-3">
          {/* Themes prontos */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => update('primaryColor', t.primary)}
                className="group relative flex flex-col items-center gap-1"
                title={t.name}
              >
                <span
                  className="w-9 h-9 rounded-full border-2 transition-all"
                  style={{
                    background: t.primary,
                    borderColor: local.primaryColor === t.primary ? '#fff' : 'transparent',
                    boxShadow: local.primaryColor === t.primary ? `0 0 0 2px ${t.primary}` : 'none'
                  }}
                />
                <span className="text-[10px] text-gray-500 group-hover:text-white transition-colors">{t.name}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500">Cores personalizadas</p>
          {/* Preset grid */}
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => update('primaryColor', c)}
                className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                style={{
                  background: c,
                  borderColor: local.primaryColor === c ? '#fff' : 'rgba(255,255,255,0.1)',
                }}
              >
                {local.primaryColor === c && (
                  <Check className="w-4 h-4 mx-auto" style={{ color: c === '#ffffff' ? '#000' : '#fff' }} />
                )}
              </button>
            ))}
          </div>

          {/* Custom hex */}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={local.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0.5"
            />
            <Input
              value={local.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
              className="bg-[#1a1a2e] border-white/10 w-32 font-mono text-sm"
              placeholder="#ff5000"
            />
          </div>
        </div>
      </Section>

      {/* ── Fundo ── */}
      <Section title="🖼️ Fundo">
        <div className="flex gap-3 mb-4">
          {['solid','image'].map(t => (
            <button
              key={t}
              onClick={() => update('bgType', t)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                local.bgType === t
                  ? 'border-[var(--theme-primary,#ff5000)] bg-[var(--theme-primary,#ff5000)]/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {t === 'solid' ? <><Monitor className="w-4 h-4" /> Cor Sólida</> : <><Image className="w-4 h-4" /> Imagem</>}
            </button>
          ))}
        </div>

        {local.bgType === 'image' && (
          <div className="space-y-3">
            <label className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 cursor-pointer transition-all text-sm text-gray-400 hover:text-white">
              <Image className="w-4 h-4" />
              {uploading ? 'Enviando...' : local.bgImage ? 'Trocar imagem' : 'Escolher imagem'}
              <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} disabled={uploading} />
            </label>
            {local.bgImage && (
              <div className="relative rounded-xl overflow-hidden h-28">
                <img src={local.bgImage} className="w-full h-full object-cover" alt="bg preview" />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xs text-white/70">Prévia com overlay</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Botões ── */}
      <Section title="⬜ Estilo dos Botões">
        <div className="flex gap-3">
          {[
            { key: 'rounded', label: 'Arredondado', style: 'rounded-full' },
            { key: 'default', label: 'Padrão',      style: 'rounded-lg'   },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => update('buttonStyle', opt.key)}
              className={`flex-1 py-3 border text-sm font-medium transition-all ${opt.style} ${
                local.buttonStyle === opt.key
                  ? 'border-[var(--theme-primary,#ff5000)] bg-[var(--theme-primary,#ff5000)]/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Preview Live ── */}
      <Section title="👁️ Preview">
        <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/10 space-y-3">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-sm font-medium text-white gradient-primary transition-all"
              style={{ borderRadius: local.buttonStyle === 'rounded' ? '9999px' : '8px' }}
            >
              Botão Principal
            </button>
            <button
              className="px-4 py-2 text-sm font-medium border border-white/20 rounded-lg text-gray-400 hover:text-white transition-all"
            >
              Secundário
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full gradient-primary" />
            <span className="text-sm text-white">Destaque com a cor principal</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
            <div className="h-full gradient-primary w-2/3 rounded-full" />
          </div>
        </div>
      </Section>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={handleReset} className="hover:bg-white/10">
          <RotateCcw className="w-4 h-4 mr-2" />
          Descartar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary">
          {saved ? <><Check className="w-4 h-4 mr-2" /> Salvo!</> : <><Save className="w-4 h-4 mr-2" />{saving ? 'Salvando...' : 'Salvar Personalização'}</>}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
      {children}
    </div>
  );
}