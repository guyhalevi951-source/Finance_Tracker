import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { THEME_STORAGE_KEY } from './src/config/app';

function injectThemeStorageKey(): Plugin {
  return {
    name: 'inject-theme-storage-key',
    transformIndexHtml(html) {
      return html.replaceAll('%THEME_STORAGE_KEY%', THEME_STORAGE_KEY);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectThemeStorageKey()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
