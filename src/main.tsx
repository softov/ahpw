import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@softov/scena/styles/theme.css';
import '@softov/scena/styles/geometry.css';
import '@softov/scena/styles/base.css';
import '@softov/scena/styles/bar.css';
import '@softov/scena/styles/scrollbar.css';
import '@softov/scena/styles/surface.css';

import { applyTheme, resolveThemeMode, type ThemeModeChoice } from '@softov/scena/styles';
import './style/app.css';
import './shell/embed/embed.css';
import App from './App.js';
import { THEME_ID_KEY, THEME_MODE_KEY } from './lib/theme-keys.js';
import { embedder } from './shell/embed/index.js';
import { startFrame } from './shell/embed/frame.js';

/** A stored value, or null where storage is blocked. */
function stored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Applied before React so the first paint already has the chosen theme.
const savedMode = stored(THEME_MODE_KEY);
const choice: ThemeModeChoice = savedMode === 'light' || savedMode === 'dark' || savedMode === 'system' ? savedMode : 'system';
applyTheme(document.documentElement, stored(THEME_ID_KEY) ?? 'default', resolveThemeMode(choice));

// An embedder that gives the window has drawn no OS frame; ahpw draws it.
if (embedder?.window !== undefined) startFrame(embedder.window);

const root = document.getElementById('root');
if (!root) throw new Error('No #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
