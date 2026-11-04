import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import logger from 'loglevel'

import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import '@blueprintjs/select/lib/css/blueprint-select.css'
import './index.css'

import 'i18n'
import { useAuthStore } from 'auth/auth.store'
import App from './App.tsx'

// Apply persisted theme before render to prevent flash
try {
  const stored = JSON.parse(localStorage.getItem('app-storage') || '{}');
  const mode = stored?.state?.themeMode ?? 'system';
  const isDark = mode === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : mode === 'dark';
  if (isDark) {
    document.documentElement.classList.add('bp6-dark');
  }
} catch { /* ignore */ }

logger.setDefaultLevel(
  import.meta.env.DEV ? logger.levels.DEBUG : logger.levels.WARN
)

// Subscribe to supabase auth once for the app lifetime (outside StrictMode double effects)
useAuthStore.getState().init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
