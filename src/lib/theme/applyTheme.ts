import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEMES,
  type AppTheme,
} from '../../config/app';

export function getStoredTheme(): AppTheme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return DEFAULT_THEME;
}

export function applyTheme(theme: AppTheme): void {
  if (!THEMES.includes(theme)) return;

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark');
}
