import React, { createContext, useContext, useEffect, useState } from 'react';
import { localApp } from '@/api/localClient';

const ThemeContext = createContext({});

export const THEMES = {
  laranja: { name: 'Laranja',   primary: '#ff5000', dark: '#cc4000' },
  azul:    { name: 'Azul',      primary: '#3b82f6', dark: '#2563eb' },
  verde:   { name: 'Verde',     primary: '#22c55e', dark: '#16a34a' },
  roxo:    { name: 'Roxo',      primary: '#a855f7', dark: '#9333ea' },
  rosa:    { name: 'Rosa',      primary: '#ec4899', dark: '#db2777' },
};

const DEFAULT_PREFS = {
  themeKey:        'laranja',
  primaryColor:    '#ff5000',
  bgMode:          'dark',        // 'dark' | 'light'
  bgType:          'solid',       // 'solid' | 'image'
  bgImage:         '',
  buttonStyle:     'rounded',     // 'rounded' | 'default'
};

function applyTheme(prefs) {
  const root = document.documentElement;
  const primary = prefs.primaryColor || '#ff5000';

  // Primary CSS var used by gradient-primary helper class
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-primary-dark', shadeColor(primary, -20));

  // Inject a <style> tag so all gradient-primary + other helpers pick up the new color
  let tag = document.getElementById('user-theme-style');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'user-theme-style';
    document.head.appendChild(tag);
  }

  const btnRadius = prefs.buttonStyle === 'rounded' ? '9999px' : '8px';

  tag.textContent = `
    .gradient-primary {
      background: linear-gradient(135deg, ${primary} 0%, ${shadeColor(primary, 20)} 100%) !important;
    }
    .glow-primary {
      box-shadow: 0 0 20px ${primary}55 !important;
    }
    .text-\\[\\#ff5000\\], .text-primary-custom {
      color: ${primary} !important;
    }
    .border-\\[\\#ff5000\\], .border-primary-custom {
      border-color: ${primary} !important;
    }
    .bg-\\[\\#ff5000\\]\\/10, .bg-primary-custom\\/10 {
      background-color: ${primary}1a !important;
    }
    .bg-\\[\\#ff5000\\]\\/20, .bg-primary-custom\\/20 {
      background-color: ${primary}33 !important;
    }
    .data-\\[state\\=active\\]\\:bg-\\[\\#ff5000\\][data-state=active] {
      background-color: ${primary} !important;
    }
    .nav-active {
      background: linear-gradient(135deg, ${primary}33 0%, ${primary}1a 100%) !important;
      border-left-color: ${primary} !important;
    }
    button.gradient-primary, a.gradient-primary {
      border-radius: ${btnRadius} !important;
    }
    ${prefs.bgType === 'image' && prefs.bgImage ? `
      .bg-\\[\\#0a0a0f\\], body > div > div {
        background: none !important;
      }
    ` : ''}
  `;

  // Background
  const appRoot = document.getElementById('root')?.firstElementChild;
  if (appRoot) {
    if (prefs.bgType === 'image' && prefs.bgImage) {
      appRoot.style.backgroundImage  = `url(${prefs.bgImage})`;
      appRoot.style.backgroundSize   = 'cover';
      appRoot.style.backgroundPosition = 'center';
      appRoot.style.backgroundAttachment = 'fixed';
    } else {
      appRoot.style.backgroundImage  = '';
      appRoot.style.backgroundColor  = prefs.bgMode === 'light' ? '#f3f4f6' : '#0a0a0f';
    }
  }
}

function shadeColor(hex, percent) {
  try {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.max(0, r + (r * percent) / 100));
    g = Math.min(255, Math.max(0, g + (g * percent) / 100));
    b = Math.min(255, Math.max(0, b + (b * percent) / 100));
    return `#${Math.round(r).toString(16).padStart(2,'0')}${Math.round(g).toString(16).padStart(2,'0')}${Math.round(b).toString(16).padStart(2,'0')}`;
  } catch { return hex; }
}

export function ThemeProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [employeeId, setEmployeeId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await localApp.auth.me();
        const emps = await localApp.entities.Employee.filter({ user_id: user.id });
        if (emps.length > 0) {
          setEmployeeId(emps[0].id);
          const saved = emps[0].theme_prefs;
          if (saved) {
            const merged = { ...DEFAULT_PREFS, ...saved };
            setPrefs(merged);
            applyTheme(merged);
          } else {
            applyTheme(DEFAULT_PREFS);
          }
        } else {
          applyTheme(DEFAULT_PREFS);
        }
      } catch {
        applyTheme(DEFAULT_PREFS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const savePrefs = async (newPrefs) => {
    const merged = { ...prefs, ...newPrefs };
    setPrefs(merged);
    applyTheme(merged);
    if (employeeId) {
      await localApp.entities.Employee.update(employeeId, { theme_prefs: merged });
    }
  };

  const previewPrefs = (newPrefs) => {
    applyTheme({ ...prefs, ...newPrefs });
  };

  const resetPreview = () => applyTheme(prefs);

  return (
    <ThemeContext.Provider value={{ prefs, savePrefs, previewPrefs, resetPreview, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}